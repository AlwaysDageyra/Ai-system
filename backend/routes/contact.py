from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.ContactMessage import ContactMessage
from backend.routes.auth import super_admin_required

contact_bp = Blueprint("contact", __name__)


@contact_bp.post("/api/contact")
def submit_contact():
    """Public endpoint — anyone can submit a contact message."""
    data = request.get_json() or {}
    name    = (data.get("name")    or "").strip()
    email   = (data.get("email")   or "").strip()
    subject = (data.get("subject") or "").strip()
    message = (data.get("message") or "").strip()
    company = (data.get("company") or "").strip() or None

    if not name or not email or not subject or not message:
        return jsonify({"message": "name, email, subject and message are required"}), 400

    msg = ContactMessage(name=name, email=email, company=company, subject=subject, message=message)
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": "Message received. We'll get back to you within 1 business day."}), 201


@contact_bp.get("/api/super-admin/messages")
@super_admin_required
def get_messages(current_user):
    """Super Admin: list all contact messages, newest first."""
    msgs = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    unread = ContactMessage.query.filter_by(is_read=False).count()
    return jsonify({"messages": [m.to_dict() for m in msgs], "unread": unread}), 200


@contact_bp.patch("/api/super-admin/messages/<int:msg_id>/read")
@super_admin_required
def mark_read(current_user, msg_id):
    """Super Admin: mark a single message as read."""
    msg = ContactMessage.query.get(msg_id)
    if not msg:
        return jsonify({"message": "Message not found"}), 404
    msg.is_read = True
    db.session.commit()
    return jsonify(msg.to_dict()), 200


@contact_bp.patch("/api/super-admin/messages/read-all")
@super_admin_required
def mark_all_read(current_user):
    """Super Admin: mark every unread message as read."""
    ContactMessage.query.filter_by(is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All messages marked as read"}), 200
