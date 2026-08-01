from datetime import datetime, timezone
from backend.extensions import db

# approval_status values:
#   draft      – saved by admin, not yet submitted
#   pending    – submitted to Super Admin for review
#   approved   – Super Admin approved; published to suppliers
#   rejected   – Super Admin rejected; returned for editing

class Tender(db.Model):
    __tablename__ = "tenders"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    pdf_path = db.Column(db.String(512), nullable=True)
    deadline = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    sector = db.Column(db.String(50), nullable=True)

    # Approval workflow
    approval_status = db.Column(db.String(20), nullable=False, default="draft")
    rejection_reason = db.Column(db.Text, nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    submitted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    created_by = db.relationship("User", foreign_keys=[created_by_id], backref=db.backref("created_tenders", lazy=True))

    requirements = db.relationship("TenderRequirement", backref="tender", lazy=True, cascade="all, delete-orphan")
    proposals = db.relationship("Proposal", backref="tender", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "pdf_path": self.pdf_path,
            "sector": self.sector,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "approval_status": self.approval_status,
            "rejection_reason": self.rejection_reason,
            "created_by_id": self.created_by_id,
            "created_by": {
                "id": self.created_by.id,
                "name": self.created_by.name,
                "email": self.created_by.email,
                "company_name": self.created_by.company_name,
                "phone": self.created_by.phone,
                "registration_number": self.created_by.registration_number,
            } if self.created_by else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "requirements": [req.to_dict() for req in self.requirements]
        }
