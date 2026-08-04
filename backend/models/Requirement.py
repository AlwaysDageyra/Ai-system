from backend.extensions import db

class TenderRequirement(db.Model):
    __tablename__ = "tender_requirements"

    id = db.Column(db.Integer, primary_key=True)
    tender_id = db.Column(db.Integer, db.ForeignKey("tenders.id"), nullable=False, index=True)
    requirement_name = db.Column(db.String(255), nullable=False)
    display_label = db.Column(db.String(255), nullable=True)
    points = db.Column(db.Integer, nullable=False, default=0)
    is_mandatory = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "tender_id": self.tender_id,
            "requirement_name": self.requirement_name,
            "display_label": self.display_label or self.requirement_name.replace('_', ' ').title(),
            "points": self.points,
            "is_mandatory": self.is_mandatory,
        }


class ProposalRequirement(db.Model):
    __tablename__ = "proposal_requirements"

    id = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey("proposals.id"), nullable=False, index=True)
    requirement_name = db.Column(db.String(255), nullable=False)
    display_label = db.Column(db.String(255), nullable=True)
    detected = db.Column(db.Boolean, nullable=False, default=False)
    is_mandatory = db.Column(db.Boolean, nullable=False, default=False)
    points_earned = db.Column(db.Integer, nullable=False, default=0)
    points_possible = db.Column(db.Integer, nullable=False, default=0)
    confidence = db.Column(db.Float, nullable=False, default=1.0)

    def to_dict(self):
        return {
            "id": self.id,
            "proposal_id": self.proposal_id,
            "requirement_name": self.requirement_name,
            "display_label": self.display_label or self.requirement_name.replace('_', ' ').title(),
            "detected": self.detected,
            "is_mandatory": self.is_mandatory,
            "points_earned": self.points_earned,
            "points_possible": self.points_possible,
            "confidence": self.confidence,
        }
