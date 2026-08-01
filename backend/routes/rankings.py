from flask import Blueprint, jsonify
from backend.models.Tender import Tender
from backend.routes.auth import token_required
from backend.services.ranking_service import RankingService

rankings_bp = Blueprint("rankings", __name__)

@rankings_bp.get("/api/rankings/<int:tender_id>")
@token_required
def get_rankings(current_user, tender_id):
    """Retrieve list of proposals for a tender ranked by score."""
    if current_user.role not in ("admin", "super_admin"):
        return jsonify({"message": "Access denied"}), 403

    tender = Tender.query.get(tender_id)
    if not tender:
        return jsonify({"message": "Tender not found"}), 404

    # Admin can only view rankings for their own tenders
    if current_user.role == "admin" and tender.created_by_id != current_user.id:
        return jsonify({"message": "Forbidden: not your tender"}), 403

    rankings = RankingService.get_rankings(tender_id)
    return jsonify({
        "tender_id": tender_id,
        "tender_title": tender.title,
        "rankings": rankings
    }), 200
