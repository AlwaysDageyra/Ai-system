"""
Rule-based weighted scoring. Normalizes each dimension against peer submissions
for the same tender so scores stay comparable as new bids arrive.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from app.models.evaluation import Evaluation, Submission
from app.models.supplier import Supplier

# Weights must sum to 1.0 for interpretability.
PRICE_WEIGHT = Decimal("0.30")
EXPERIENCE_WEIGHT = Decimal("0.25")
DELIVERY_WEIGHT = Decimal("0.15")
COMPLIANCE_WEIGHT = Decimal("0.30")


class ScoringService:
    """Computes component scores and weighted total for one submission."""

    def score_submission(
        self,
        submission: Submission,
        peer_submissions: Iterable[Submission],
        suppliers_by_id: dict[int, Supplier],
    ) -> Evaluation:
        """
        Build or refresh an Evaluation row for submission.

        peer_submissions should include *all* submissions for the tender (including
        the target) so min/max normalization is stable.
        """
        peers = list(peer_submissions)
        supplier = suppliers_by_id.get(submission.supplier_id)
        years = supplier.years_experience if supplier else 0

        if not submission.compliance:
            # Hard gate: non-compliant bids are disqualified from the competition.
            return Evaluation(
                submission_id=submission.id,
                price_score=Decimal("0"),
                experience_score=Decimal("0"),
                delivery_score=Decimal("0"),
                compliance_score=Decimal("0"),
                total_score=Decimal("0"),
            )

        prices = [s.price for s in peers if s.price is not None]
        deliveries = [s.delivery_days for s in peers if s.delivery_days is not None]
        experiences = [
            suppliers_by_id[s.supplier_id].years_experience
            for s in peers
            if s.supplier_id in suppliers_by_id
        ]

        price_component = self._normalize_lower_is_better(
            submission.price, prices, default=Decimal("100")
        )
        delivery_component = self._normalize_lower_is_better(
            submission.delivery_days, [Decimal(d) for d in deliveries], default=Decimal("100")
        )
        experience_component = self._normalize_higher_is_better(
            Decimal(years), [Decimal(e) for e in experiences], default=Decimal("100")
        )

        compliance_component = Decimal("100") if submission.compliance else Decimal("0")

        total = (
            PRICE_WEIGHT * price_component
            + EXPERIENCE_WEIGHT * experience_component
            + DELIVERY_WEIGHT * delivery_component
            + COMPLIANCE_WEIGHT * compliance_component
        )

        return Evaluation(
            submission_id=submission.id,
            price_score=price_component,
            experience_score=experience_component,
            delivery_score=delivery_component,
            compliance_score=compliance_component,
            total_score=total.quantize(Decimal("0.0001")),
        )

    @staticmethod
    def _normalize_lower_is_better(
        value: Decimal | int | float | None,
        population: list[Decimal],
        default: Decimal,
    ) -> Decimal:
        """Map value to 0..100 where lower raw values score higher."""
        if value is None:
            # Missing data cannot beat peers that provided a value.
            return Decimal("0") if population else default
        if not population:
            return default
        v = Decimal(value)
        lo = min(population)
        hi = max(population)
        if hi == lo:
            return default
        # Invert linear scale within population bounds
        score = (hi - v) / (hi - lo) * Decimal("100")
        return max(Decimal("0"), min(Decimal("100"), score.quantize(Decimal("0.001"))))

    @staticmethod
    def _normalize_higher_is_better(
        value: Decimal,
        population: list[Decimal],
        default: Decimal,
    ) -> Decimal:
        """Map value to 0..100 where higher raw values score higher."""
        if not population:
            return default
        lo = min(population)
        hi = max(population)
        if hi == lo:
            return default
        score = (value - lo) / (hi - lo) * Decimal("100")
        return max(Decimal("0"), min(Decimal("100"), score.quantize(Decimal("0.001"))))
