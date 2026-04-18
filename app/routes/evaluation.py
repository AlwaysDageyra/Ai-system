"""Submission listing, scoring, and ranking."""

from flask import Blueprint, current_app, jsonify
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.evaluation import Evaluation, Submission
from app.models.supplier import Supplier
from app.models.tender import Tender
from app.services.ranking_service import RankingService
from app.services.scoring_service import ScoringService

evaluation_bp = Blueprint("evaluation", __name__)


@evaluation_bp.get("/submissions/<int:tender_id>")
def list_submissions(tender_id: int):
    """List all submissions received for a tender."""
    tender = db.session.get(Tender, tender_id)
    if tender is None:
        return jsonify({"error": "not_found", "message": "Tender not found"}), 404

    submissions = db.session.scalars(
        select(Submission)
        .where(Submission.tender_id == tender_id)
        .order_by(Submission.id)
    ).all()
    return jsonify(
        {
            "tender_id": tender_id,
            "submissions": [s.to_dict(include_text=False) for s in submissions],
        }
    )


@evaluation_bp.post("/evaluate/<int:submission_id>")
def evaluate_submission(submission_id: int):
    """
    Run rule-based scoring for all submissions under the same tender.

    Normalization uses the full peer set, so evaluating any submission refreshes
    every Evaluation row for that tender to keep rankings fair.
    """
    submission = db.session.get(Submission, submission_id)
    if submission is None:
        return jsonify({"error": "not_found", "message": "Submission not found"}), 404

    tender_id = submission.tender_id
    try:
        _recalculate_evaluations_for_tender(tender_id)
        db.session.commit()
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("evaluate_failed")
        return jsonify({"error": "server_error", "message": str(exc)}), 500

    refreshed = db.session.scalars(
        select(Submission)
        .options(joinedload(Submission.evaluation))
        .where(Submission.id == submission_id)
    ).first()
    ev = refreshed.evaluation if refreshed else None
    return jsonify(
        {
            "message": "evaluations_updated",
            "tender_id": tender_id,
            "submission_id": submission_id,
            "evaluation": ev.to_dict() if ev else None,
        }
    )


@evaluation_bp.get("/rank/<int:tender_id>")
def rank_tender(tender_id: int):
    """Return suppliers ranked by total_score for the tender."""
    tender = db.session.get(Tender, tender_id)
    if tender is None:
        return jsonify({"error": "not_found", "message": "Tender not found"}), 404

    ranking = RankingService().rank_for_tender(tender_id)
    return jsonify({"tender_id": tender_id, "ranking": ranking})


def _recalculate_evaluations_for_tender(tender_id: int) -> None:
    """Recompute and upsert Evaluation rows for every submission on a tender."""
    submissions = db.session.scalars(
        select(Submission).where(Submission.tender_id == tender_id)
    ).all()
    if not submissions:
        return

    supplier_ids = {s.supplier_id for s in submissions}
    suppliers = db.session.scalars(select(Supplier).where(Supplier.id.in_(supplier_ids))).all()
    suppliers_by_id = {s.id: s for s in suppliers}

    scorer = ScoringService()
    for sub in submissions:
        computed = scorer.score_submission(sub, submissions, suppliers_by_id)
        existing = db.session.scalars(
            select(Evaluation).where(Evaluation.submission_id == sub.id)
        ).first()
        if existing:
            existing.price_score = computed.price_score
            existing.experience_score = computed.experience_score
            existing.delivery_score = computed.delivery_score
            existing.compliance_score = computed.compliance_score
            existing.total_score = computed.total_score
        else:
            computed.submission_id = sub.id
            db.session.add(computed)
