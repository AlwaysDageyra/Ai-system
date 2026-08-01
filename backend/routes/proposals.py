from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import os
import threading
from uuid import uuid4
from werkzeug.utils import secure_filename
from backend.extensions import db
from backend.models.Proposal import Proposal
from backend.models.Tender import Tender
from backend.models.Requirement import ProposalRequirement
from backend.routes.auth import token_required

proposals_bp = Blueprint("proposals", __name__)

def _is_allowed(file_storage):
    filename = file_storage.filename or ""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_EXTENSIONS"]

def _unique_filename(filename):
    safe_name = secure_filename(filename)
    stem, ext = os.path.splitext(safe_name)
    return f"{stem or 'proposal'}-{uuid4().hex[:10]}{ext.lower()}"

def _score_in_background(app, proposal_id, save_path, tender_req_dict):
    """Score a proposal against tender requirements using sentence-transformers cosine similarity."""
    with app.app_context():
        try:
            from backend.services.compliance_checker import extract_text, match_supplier
            from backend.services.ai_requirement_service import AIRequirementService

            sentence_model = getattr(app, 'sentence_model', None)
            text = extract_text(save_path)

            # Build requirements list from tender_req_dict
            requirements = [
                {
                    'text':         info['display_label'],
                    'is_mandatory': info['is_mandatory'],
                    'req_name':     req_name,
                    'points':       info['points'],
                }
                for req_name, info in tender_req_dict.items()
            ]

            if sentence_model and requirements:
                items, percentage, disqualified, _ = match_supplier(sentence_model, requirements, text)

                proposal = db.session.get(Proposal, proposal_id)
                if not proposal:
                    return

                proposal.score = 0.0 if disqualified else percentage
                proposal.red_flags = None

                for item, req_info in zip(items, requirements):
                    status = item['status']
                    pts_possible = req_info['points']
                    pts_earned = pts_possible if status == 'Met' else (pts_possible // 2 if status == 'Partial' else 0)
                    p_req = ProposalRequirement(
                        proposal_id=proposal_id,
                        requirement_name=req_info['req_name'],
                        display_label=req_info['text'][:250],
                        detected=status in ('Met', 'Partial'),
                        is_mandatory=req_info['is_mandatory'],
                        points_earned=pts_earned,
                        points_possible=pts_possible,
                        confidence=item['similarity'],
                        llm_verdict=status,
                    )
                    db.session.add(p_req)

            else:
                # Keyword fallback if sentence model not loaded
                detected = set(AIRequirementService.extract_requirements(text))
                total_score = 0
                max_score = sum(r['points'] for r in tender_req_dict.values() if not r['is_mandatory']) or 1

                proposal = db.session.get(Proposal, proposal_id)
                if not proposal:
                    return

                for req_name, info in tender_req_dict.items():
                    is_det = req_name in detected
                    pts = info['points'] if is_det else 0
                    if not info['is_mandatory']:
                        total_score += pts
                    p_req = ProposalRequirement(
                        proposal_id=proposal_id,
                        requirement_name=req_name,
                        display_label=info['display_label'][:250],
                        detected=is_det,
                        is_mandatory=info['is_mandatory'],
                        points_earned=pts,
                        points_possible=info['points'],
                        confidence=0.9 if is_det else 0.1,
                        llm_verdict=None,
                    )
                    db.session.add(p_req)

                proposal.score = round(total_score / max_score * 100, 1)
                proposal.red_flags = None

            db.session.commit()
            app.logger.info(f"[BG] Scored proposal {proposal_id}: {proposal.score}%")

        except Exception as e:
            import traceback
            db.session.rollback()
            app.logger.error(f"[BG] Scoring error for proposal {proposal_id}: {e}\n{traceback.format_exc()}")


@proposals_bp.post("/api/proposals")
@token_required
def submit_proposal(current_user):
    """Submit a supplier proposal (PDF or Word upload)."""
    if current_user.role != "supplier":
        return jsonify({"message": "Forbidden: Supplier role required"}), 403

    tender_id = request.form.get("tender_id")
    proposal_file = request.files.get("file")

    if not tender_id or not proposal_file:
        return jsonify({"message": "Tender ID and document file are required"}), 400

    if not _is_allowed(proposal_file):
        return jsonify({"message": "Only PDF or Word documents (.pdf, .docx, .doc) are accepted"}), 400

    try:
        tender_id = int(tender_id)
    except ValueError:
        return jsonify({"message": "Invalid Tender ID"}), 400

    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404

    if tender.deadline and datetime.utcnow() > tender.deadline.replace(tzinfo=None):
        return jsonify({"message": "This tender is closed. The submission deadline has passed."}), 400

    # Block duplicate proposals
    existing = Proposal.query.filter_by(supplier_id=current_user.id, tender_id=tender_id).first()
    if existing:
        return jsonify({"message": "You have already submitted a proposal for this tender."}), 409

    # Save file
    os.makedirs(current_app.config["PROPOSALS_UPLOAD_FOLDER"], exist_ok=True)
    filename = _unique_filename(proposal_file.filename)
    save_path = os.path.join(current_app.config["PROPOSALS_UPLOAD_FOLDER"], filename)
    proposal_file.save(save_path)
    pdf_path = f"uploads/proposals/{filename}"

    # Save proposal immediately — score updated by background thread
    new_proposal = Proposal(
        supplier_id=current_user.id,
        tender_id=tender_id,
        pdf_path=pdf_path,
        score=0.0,
        status="under_review",
    )
    db.session.add(new_proposal)
    try:
        db.session.commit()
    except Exception as e:
        import traceback
        db.session.rollback()
        current_app.logger.error(f"DB commit error: {e}\n{traceback.format_exc()}")
        return jsonify({"message": f"Database error: {str(e)}"}), 500

    # Build tender requirements dict for background scorer
    tender_req_dict = {
        t_req.requirement_name: {
            'display_label': t_req.display_label or t_req.requirement_name.replace('_', ' ').title(),
            'points':        t_req.points,
            'is_mandatory':  t_req.is_mandatory,
        }
        for t_req in tender.requirements
    }

    # Launch background scoring thread (non-blocking)
    app = current_app._get_current_object()
    thread = threading.Thread(
        target=_score_in_background,
        args=(app, new_proposal.id, save_path, tender_req_dict),
        daemon=True,
    )
    thread.start()

    return jsonify(new_proposal.to_dict()), 201

@proposals_bp.get("/api/proposals/<int:proposal_id>")
@token_required
def get_proposal_by_id(current_user, proposal_id):
    """Retrieve details of a single proposal submission."""
    proposal = Proposal.query.get(proposal_id)
    if not proposal:
        return jsonify({"message": "Proposal not found"}), 404

    if current_user.role == "super_admin":
        pass  # full access
    elif current_user.role == "admin":
        # Admin can only view proposals submitted to their own tenders
        if proposal.tender.created_by_id != current_user.id:
            return jsonify({"message": "Forbidden: Access denied"}), 403
    else:
        # Supplier can only view their own proposals
        if proposal.supplier_id != current_user.id:
            return jsonify({"message": "Forbidden: Access denied"}), 403

    return jsonify(proposal.to_dict()), 200

@proposals_bp.get("/api/proposals")
@token_required
def get_proposals(current_user):
    """Retrieve proposals list scoped by role."""
    if current_user.role == "super_admin":
        proposals = Proposal.query.all()
    elif current_user.role == "admin":
        # Only proposals submitted to this admin's own tenders
        own_tender_ids = db.session.query(Tender.id).filter_by(created_by_id=current_user.id)
        proposals = Proposal.query.filter(Proposal.tender_id.in_(own_tender_ids)).all()
    else:
        proposals = Proposal.query.filter_by(supplier_id=current_user.id).all()

    return jsonify([p.to_dict() for p in proposals]), 200

@proposals_bp.patch("/api/proposals/<int:proposal_id>/status")
@token_required
def update_proposal_status(current_user, proposal_id):
    """Update proposal status (Admin only, own tenders only)."""
    if current_user.role not in ("admin", "super_admin"):
        return jsonify({"message": "Forbidden: Admin role required"}), 403

    proposal = Proposal.query.get(proposal_id)
    if not proposal:
        return jsonify({"message": "Proposal not found"}), 404

    if current_user.role == "admin" and proposal.tender.created_by_id != current_user.id:
        return jsonify({"message": "Forbidden: not your tender"}), 403

    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ("under_review", "approved", "rejected"):
        return jsonify({"message": "Invalid status. Must be under_review, approved, or rejected."}), 400

    proposal.status = new_status
    db.session.commit()
    return jsonify(proposal.to_dict()), 200
