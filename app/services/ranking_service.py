"""Ordering suppliers by evaluation totals for a tender."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.evaluation import Evaluation, Submission


class RankingService:
    """Read-side ranking built on persisted Evaluation rows."""

    def rank_for_tender(self, tender_id: int) -> list[dict]:
        """
        Return submissions for tender ordered by total_score descending.

        Unevaluated submissions appear last with total_score null.
        """
        submissions = (
            db.session.query(Submission)
            .options(joinedload(Submission.supplier), joinedload(Submission.evaluation))
            .filter(Submission.tender_id == tender_id)
            .all()
        )

        def sort_key(s: Submission):
            ev = s.evaluation
            if ev is None:
                return (1, Decimal("0"), s.id)  # unevaluated last, stable order
            return (0, -ev.total_score, s.id)  # higher score first, then id

        ranked = sorted(submissions, key=sort_key)
        out: list[dict] = []
        position = 0
        for s in ranked:
            position += 1
            ev = s.evaluation
            out.append(
                {
                    "rank": position,
                    "submission_id": s.id,
                    "supplier": s.supplier.to_dict() if s.supplier else None,
                    "total_score": float(ev.total_score) if ev else None,
                    "evaluation": ev.to_dict() if ev else None,
                    "submission": s.to_dict(),
                }
            )
        return out
