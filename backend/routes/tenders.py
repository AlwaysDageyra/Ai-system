from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timezone
import os
import threading
from uuid import uuid4
from werkzeug.utils import secure_filename
from backend.extensions import db
from backend.models.Tender import Tender
from backend.models.Requirement import TenderRequirement
from backend.routes.auth import token_required, admin_or_super_required, super_admin_required
from backend.services.ai_requirement_service import AIRequirementService

tenders_bp = Blueprint("tenders", __name__)

def _is_allowed_pdf(file_storage):
    filename = file_storage.filename or ""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_EXTENSIONS"]

def _unique_filename(filename):
    safe_name = secure_filename(filename)
    stem, ext = os.path.splitext(safe_name)
    return f"{stem or 'tender'}-{uuid4().hex[:10]}{ext.lower()}"


def _extract_requirements_in_background(app, tender_id, save_path):
    """Extract requirements from tender PDF using RoBERTa classifier."""
    with app.app_context():
        try:
            from backend.services.compliance_checker import extract_text, extract_requirements

            roberta_model = getattr(app, 'roberta_model', None)
            tokenizer = getattr(app, 'roberta_tokenizer', None)

            text = extract_text(save_path)

            if roberta_model and tokenizer:
                reqs = extract_requirements(roberta_model, tokenizer, text)
            else:
                # Keyword fallback if model not loaded
                simple_reqs = AIRequirementService.extract_requirements(text, use_default_when_empty=True)
                reqs = [{'text': r.replace('_', ' ').title(), 'confidence': 1.0, 'is_mandatory': False}
                        for r in simple_reqs]

            TenderRequirement.query.filter_by(tender_id=tender_id).delete()
            for idx, req in enumerate(reqs):
                req_name = f"REQ_{idx + 1}"
                db.session.add(TenderRequirement(
                    tender_id=tender_id,
                    requirement_name=req_name,
                    display_label=req['text'][:250],
                    points=10,
                    is_mandatory=req['is_mandatory'],
                ))
            db.session.commit()
            app.logger.info(f"[BG] Extracted {len(reqs)} requirements for tender {tender_id}")

        except Exception as e:
            import traceback
            db.session.rollback()
            app.logger.error(f"[BG] Requirement extraction error for tender {tender_id}: {e}\n{traceback.format_exc()}")


@tenders_bp.get("/api/tenders/public")
def get_public_tenders():
    """List approved tenders — no authentication required."""
    tenders = Tender.query.filter_by(approval_status="approved").order_by(Tender.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tenders]), 200


@tenders_bp.get("/api/tenders/public/<int:tender_id>")
def get_public_tender(tender_id):
    """Get a single approved tender — no authentication required."""
    tender = Tender.query.get(tender_id)
    if not tender or tender.approval_status != "approved":
        return jsonify({"message": "Tender not found"}), 404
    return jsonify(tender.to_dict()), 200


@tenders_bp.get("/api/stats/public")
def get_public_stats():
    """Basic public stats for the home page."""
    from backend.models.User import User
    from backend.models.Proposal import Proposal
    return jsonify({
        "total_tenders": Tender.query.filter_by(approval_status="approved").count(),
        "total_suppliers": User.query.filter_by(role="supplier").count(),
        "total_proposals": Proposal.query.count(),
    }), 200


@tenders_bp.get("/api/tenders")
@token_required
def get_all_tenders(current_user):
    """Retrieve tenders based on role:
       - super_admin: all tenders
       - admin: only their own tenders
       - supplier: only approved tenders
    """
    if current_user.role == "super_admin":
        tenders = Tender.query.order_by(Tender.created_at.desc()).all()
    elif current_user.role == "admin":
        tenders = Tender.query.filter_by(created_by_id=current_user.id).order_by(Tender.created_at.desc()).all()
    else:
        tenders = Tender.query.filter_by(approval_status="approved").order_by(Tender.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tenders]), 200

@tenders_bp.get("/api/tenders/<int:tender_id>")
@token_required
def get_tender_by_id(current_user, tender_id):
    """Retrieve details for a single tender."""
    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404
    return jsonify(tender.to_dict()), 200

@tenders_bp.patch("/api/tenders/<int:tender_id>/submit")
@token_required
def submit_tender_for_approval(current_user, tender_id):
    """Admin submits a draft tender to the Super Admin approval queue."""
    if current_user.role not in ("admin", "super_admin"):
        return jsonify({"message": "Forbidden"}), 403
    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404
    if current_user.role == "admin" and tender.created_by_id != current_user.id:
        return jsonify({"message": "Forbidden: not your tender"}), 403
    if tender.approval_status not in ("draft", "rejected"):
        return jsonify({"message": f"Cannot submit tender with status '{tender.approval_status}'"}), 400
    tender.approval_status = "pending"
    tender.rejection_reason = None
    tender.submitted_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(tender.to_dict()), 200


@tenders_bp.post("/api/tenders")
@token_required
def create_tender(current_user):
    """Create a new tender (Admin only). Saves as draft; ML requirement extraction runs in background."""
    if current_user.role not in ("admin", "super_admin"):
        return jsonify({"message": "Forbidden: Admin role required"}), 403

    SECTORS = {
        "Food Security & Agriculture", "ICT & Technology", "Education & Training",
        "Engineering & Infrastructure", "Energy & Power", "Office Supplies & Printing",
        "Consultancy & Research", "Logistics & Flight Rental", "Healthcare & Insurance",
        "General Procurement",
    }

    title = request.form.get("title")
    description = request.form.get("description")
    deadline_str = request.form.get("deadline")
    sector = (request.form.get("sector") or "").strip()
    pdf_file = request.files.get("file")

    if not title:
        return jsonify({"message": "Title is required"}), 400
    if not sector or sector not in SECTORS:
        return jsonify({"message": f"Sector is required. Choose one of: {', '.join(sorted(SECTORS))}"}), 400

    deadline = None
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str).replace(tzinfo=timezone.utc)
        except ValueError:
            return jsonify({"message": "Invalid deadline format. Use ISO 8601 (YYYY-MM-DD)."}), 400

    os.makedirs(current_app.config["TENDERS_UPLOAD_FOLDER"], exist_ok=True)

    pdf_path = None
    save_path = None

    if pdf_file:
        if not _is_allowed_pdf(pdf_file):
            return jsonify({"message": "Only PDF files are accepted"}), 400
        filename = _unique_filename(pdf_file.filename)
        save_path = os.path.join(current_app.config["TENDERS_UPLOAD_FOLDER"], filename)
        pdf_file.save(save_path)
        pdf_path = f"uploads/tenders/{filename}"

    # Save tender as draft with default requirements as placeholders
    new_tender = Tender(
        title=title, description=description, pdf_path=pdf_path, deadline=deadline,
        sector=sector, approval_status="draft", created_by_id=current_user.id,
    )
    db.session.add(new_tender)
    db.session.flush()

    default_reqs = AIRequirementService.DEFAULT_REQUIREMENTS
    for req_name in default_reqs:
        db.session.add(TenderRequirement(
            tender_id=new_tender.id,
            requirement_name=req_name,
            display_label=req_name.replace('_', ' ').title(),
            points=5,
            is_mandatory=False,
        ))

    db.session.commit()

    # If a document was uploaded, replace defaults with ML extraction in background
    if save_path:
        app = current_app._get_current_object()
        thread = threading.Thread(
            target=_extract_requirements_in_background,
            args=(app, new_tender.id, save_path),
            daemon=True,
        )
        thread.start()

    return jsonify(new_tender.to_dict()), 201


@tenders_bp.patch("/api/tenders/<int:tender_id>")
@token_required
def update_tender(current_user, tender_id):
    """Update title, description, or deadline of a tender (Admin only)."""
    if current_user.role != "admin":
        return jsonify({"message": "Forbidden: Admin role required"}), 403

    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404

    data = request.get_json() or {}

    SECTORS = {
        "Food Security & Agriculture", "ICT & Technology", "Education & Training",
        "Engineering & Infrastructure", "Energy & Power", "Office Supplies & Printing",
        "Consultancy & Research", "Logistics & Flight Rental", "Healthcare & Insurance",
        "General Procurement",
    }

    if "title" in data:
        if not data["title"].strip():
            return jsonify({"message": "Title cannot be empty"}), 400
        tender.title = data["title"].strip()

    if "description" in data:
        tender.description = data["description"]

    if "sector" in data:
        if data["sector"] not in SECTORS:
            return jsonify({"message": f"Invalid sector. Choose one of: {', '.join(sorted(SECTORS))}"}), 400
        tender.sector = data["sector"]

    if "deadline" in data:
        if data["deadline"]:
            try:
                tender.deadline = datetime.fromisoformat(data["deadline"]).replace(tzinfo=timezone.utc)
            except ValueError:
                return jsonify({"message": "Invalid deadline format. Use ISO 8601 (YYYY-MM-DD)."}), 400
        else:
            tender.deadline = None

    db.session.commit()
    return jsonify(tender.to_dict()), 200


@tenders_bp.delete("/api/tenders/<int:tender_id>")
@token_required
def delete_tender(current_user, tender_id):
    """Delete a tender and all its requirements and proposals (Admin only)."""
    if current_user.role != "admin":
        return jsonify({"message": "Forbidden: Admin role required"}), 403

    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404

    db.session.delete(tender)
    db.session.commit()
    return jsonify({"message": "Tender deleted successfully"}), 200
