import json
from backend.models.Proposal import Proposal
from backend.models.User import User

class RankingService:
    @staticmethod
    def get_rankings(tender_id: int) -> list[dict]:
        """Get ranked list of proposals for a specific tender.
        Qualified proposals are ranked first by score desc, then disqualified ones by score desc."""
        proposals = Proposal.query.filter_by(tender_id=tender_id).order_by(
            Proposal.score.desc(),
            Proposal.submitted_at.asc()
        ).all()

        # Split: qualified first, disqualified last
        qualified = [p for p in proposals if not p.red_flags]
        disqualified = [p for p in proposals if p.red_flags]
        ordered = qualified + disqualified

        rankings = []
        for idx, prop in enumerate(ordered):
            supplier_user = User.query.get(prop.supplier_id)
            disq_reasons = []
            if prop.red_flags:
                try:
                    disq_reasons = json.loads(prop.red_flags)
                except (ValueError, TypeError):
                    disq_reasons = []
            rankings.append({
                "rank": idx + 1,
                "proposal_id": prop.id,
                "supplier_name": supplier_user.name if supplier_user else "Unknown Supplier",
                "score": prop.score,
                "disqualified": bool(prop.red_flags),
                "disq_reasons": disq_reasons,
                "submitted_at": prop.submitted_at.isoformat() if prop.submitted_at else None,
                "pdf_path": prop.pdf_path
            })
        return rankings
