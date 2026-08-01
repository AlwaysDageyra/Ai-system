import json
from datetime import datetime, timezone
from backend.extensions import db

class Proposal(db.Model):
    __tablename__ = "proposals"

    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    tender_id = db.Column(db.Integer, db.ForeignKey("tenders.id"), nullable=False, index=True)
    pdf_path = db.Column(db.String(512), nullable=True)
    score = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), nullable=False, default="under_review")
    red_flags = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    requirements = db.relationship("ProposalRequirement", backref="proposal", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        flags = []
        if self.red_flags:
            try:
                flags = json.loads(self.red_flags)
            except (ValueError, TypeError):
                flags = []
        return {
            "id": self.id,
            "supplier_id": self.supplier_id,
            "tender_id": self.tender_id,
            "pdf_path": self.pdf_path,
            "score": self.score,
            "status": self.status,
            "red_flags": flags,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "requirements": [req.to_dict() for req in self.requirements]
        }
