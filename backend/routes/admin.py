from flask import Blueprint, jsonify, request
from datetime import datetime, timezone
from backend.routes.auth import token_required, super_admin_required
from backend.extensions import db
from backend.models.User import User
from backend.models.Tender import Tender
from backend.models.Proposal import Proposal

admin_bp = Blueprint("admin", __name__)


# ─── Admin (Company Procurement Officer) stats ───────────────────────────────

@admin_bp.get("/api/admin/suppliers/<int:user_id>")
@token_required
def get_supplier_profile(current_user, user_id):
    """Procurement admin views a specific supplier's profile."""
    if current_user.role not in ("admin", "super_admin"):
        return jsonify({"message": "Forbidden"}), 403
    user = User.query.get(user_id)
    if not user or user.role != "supplier":
        return jsonify({"message": "Supplier not found"}), 404
    return jsonify(user.to_dict()), 200


@admin_bp.get("/api/admin/stats")
@token_required
def get_admin_stats(current_user):
    if current_user.role not in ("admin", "super_admin"):
        return jsonify({"message": "Forbidden"}), 403

    now = datetime.now(timezone.utc)

    if current_user.role == "super_admin":
        tenders = Tender.query.all()
    else:
        tenders = Tender.query.filter_by(created_by_id=current_user.id).all()

    tender_ids = [t.id for t in tenders]
    active_tenders = sum(1 for t in tenders if not t.deadline or t.deadline > now)

    proposals = Proposal.query.filter(Proposal.tender_id.in_(tender_ids)).all() if tender_ids else []
    total_proposals = len(proposals)
    pending  = sum(1 for p in proposals if p.status == "under_review")
    approved = sum(1 for p in proposals if p.status == "approved")
    rejected = sum(1 for p in proposals if p.status == "rejected")
    top_score = max((p.score for p in proposals), default=0)
    avg_score = round(sum(p.score for p in proposals) / total_proposals, 1) if total_proposals else 0

    recent = (Proposal.query
              .filter(Proposal.tender_id.in_(tender_ids))
              .order_by(Proposal.submitted_at.desc())
              .limit(5).all()) if tender_ids else []

    return jsonify({
        "total_tenders": len(tenders),
        "active_tenders": active_tenders,
        "total_suppliers": User.query.filter_by(role="supplier").count(),
        "total_proposals": total_proposals,
        "pending_proposals": pending,
        "approved_proposals": approved,
        "rejected_proposals": rejected,
        "top_score": round(top_score, 1),
        "avg_score": avg_score,
        "recent_proposals": [p.to_dict() for p in recent],
    }), 200


# ─── Super Admin: approval queue ─────────────────────────────────────────────

@admin_bp.get("/api/super-admin/queue")
@super_admin_required
def get_approval_queue(current_user):
    """Tenders awaiting Super Admin review."""
    pending = Tender.query.filter_by(approval_status="pending").order_by(Tender.submitted_at.asc()).all()
    result = []
    for t in pending:
        d = t.to_dict()
        creator = User.query.get(t.created_by_id) if t.created_by_id else None
        d["created_by_name"] = creator.name if creator else "Unknown"
        d["created_by_email"] = creator.email if creator else ""
        result.append(d)
    return jsonify(result), 200


@admin_bp.post("/api/super-admin/tenders/<int:tender_id>/approve")
@super_admin_required
def approve_tender(current_user, tender_id):
    """Approve and publish a tender."""
    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404
    if tender.approval_status != "pending":
        return jsonify({"message": f"Tender is not pending (current: {tender.approval_status})"}), 400
    tender.approval_status = "approved"
    tender.rejection_reason = None
    tender.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(tender.to_dict()), 200


@admin_bp.post("/api/super-admin/tenders/<int:tender_id>/reject")
@super_admin_required
def reject_tender(current_user, tender_id):
    """Reject a tender and return it to the admin for editing."""
    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404
    if tender.approval_status != "pending":
        return jsonify({"message": f"Tender is not pending (current: {tender.approval_status})"}), 400
    data = request.get_json() or {}
    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"message": "A rejection reason is required"}), 400
    tender.approval_status = "rejected"
    tender.rejection_reason = reason
    tender.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(tender.to_dict()), 200


# ─── Super Admin: platform-wide stats ─────────────────────────────────────────

@admin_bp.get("/api/super-admin/stats")
@super_admin_required
def get_super_admin_stats(current_user):
    now = datetime.now(timezone.utc)
    proposals = Proposal.query.all()
    total_proposals = len(proposals)
    return jsonify({
        "total_tenders":   Tender.query.count(),
        "draft_tenders":   Tender.query.filter_by(approval_status="draft").count(),
        "pending_tenders": Tender.query.filter_by(approval_status="pending").count(),
        "approved_tenders":Tender.query.filter_by(approval_status="approved").count(),
        "rejected_tenders":Tender.query.filter_by(approval_status="rejected").count(),
        "total_admins":    User.query.filter_by(role="admin").count(),
        "total_suppliers": User.query.filter_by(role="supplier").count(),
        "total_proposals": total_proposals,
        "approved_proposals": sum(1 for p in proposals if p.status == "approved"),
        "pending_proposals":  sum(1 for p in proposals if p.status == "under_review"),
    }), 200


# ─── Super Admin: user management ─────────────────────────────────────────────

@admin_bp.get("/api/super-admin/users")
@super_admin_required
def get_all_users(current_user):
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.post("/api/super-admin/users")
@super_admin_required
def create_user(current_user):
    """Super Admin creates admin or supplier accounts."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()
    role = data.get("role", "supplier")

    if not name or not email or not password:
        return jsonify({"message": "name, email and password are required"}), 400
    if role not in ("admin", "supplier"):
        return jsonify({"message": "role must be admin or supplier"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already in use"}), 400

    user = User(name=name, email=email, role=role)
    user.set_password(password)
    if role == "admin":
        user.must_change_password = True
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@admin_bp.patch("/api/super-admin/users/<int:user_id>")
@super_admin_required
def update_user(current_user, user_id):
    """Update a user's role or name."""
    if user_id == current_user.id:
        return jsonify({"message": "Cannot modify your own account here"}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    data = request.get_json() or {}
    if "role" in data and data["role"] in ("admin", "supplier"):
        user.role = data["role"]
    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.delete("/api/super-admin/users/<int:user_id>")
@super_admin_required
def delete_user(current_user, user_id):
    if user_id == current_user.id:
        return jsonify({"message": "Cannot delete your own account"}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200
