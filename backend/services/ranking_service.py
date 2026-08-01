from backend.models.Proposal import Proposal
from backend.models.User import User

class RankingService:
    @staticmethod
    def get_rankings(tender_id: int) -> list[dict]:
        """Get ranked list of proposals for a specific tender."""
        proposals = Proposal.query.filter_by(tender_id=tender_id).order_by(
            Proposal.score.desc(), 
            Proposal.submitted_at.asc()
        ).all()
        
        rankings = []
        for idx, prop in enumerate(proposals):
            supplier_user = User.query.get(prop.supplier_id)
            rankings.append({
                "rank": idx + 1,
                "proposal_id": prop.id,
                "supplier_name": supplier_user.name if supplier_user else "Unknown Supplier",
                "score": prop.score,
                "submitted_at": prop.submitted_at.isoformat() if prop.submitted_at else None,
                "pdf_path": prop.pdf_path
            })
        return rankings
