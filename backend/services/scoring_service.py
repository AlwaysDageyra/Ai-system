from backend.models.Proposal import Proposal
from backend.models.Tender import Tender
from backend.models.Requirement import ProposalRequirement

class ScoringService:
    @staticmethod
    def calculate_score(proposal: Proposal) -> float:
        """
        Calculate score based on how many required tender documents are detected.
        Score = (detected tender requirements / total tender requirements) * 100
        """
        tender = Tender.query.get(proposal.tender_id)
        if not tender or not tender.requirements:
            return 100.0  # Default score if no requirements exist
            
        required_names = {req.requirement_name for req in tender.requirements}
        
        proposal_requirements = ProposalRequirement.query.filter_by(proposal_id=proposal.id).all()
        detected_names = {p_req.requirement_name for p_req in proposal_requirements if p_req.detected}
        
        matched = required_names.intersection(detected_names)
        
        score = (len(matched) / len(required_names)) * 100.0
        return round(score, 2)
