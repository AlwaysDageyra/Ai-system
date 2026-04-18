"""Tender listing and detail endpoints."""

from flask import Blueprint, jsonify
from sqlalchemy import select

from app.extensions import db
from app.models.tender import Tender

tenders_bp = Blueprint("tenders", __name__)


@tenders_bp.get("/tenders")
def list_tenders():
    """Return all tenders (newest first)."""
    rows = db.session.scalars(select(Tender).order_by(Tender.created_at.desc())).all()
    return jsonify({"tenders": [t.to_dict() for t in rows]})


@tenders_bp.get("/tenders/<int:tender_id>")
def get_tender(tender_id: int):
    """Return a single tender by id."""
    tender = db.session.get(Tender, tender_id)
    if tender is None:
        return jsonify({"error": "not_found", "message": "Tender not found"}), 404
    return jsonify({"tender": tender.to_dict()})
