"""Submission (uploaded bid) and Evaluation (scores)."""

from datetime import datetime, timezone

from app.extensions import db


class Submission(db.Model):
    """One supplier's submitted documents and extracted bid fields for a tender."""

    __tablename__ = "submissions"

    id = db.Column(db.Integer, primary_key=True)
    tender_id = db.Column(db.Integer, db.ForeignKey("tenders.id"), nullable=False, index=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=False, index=True)
    price = db.Column(db.Numeric(14, 2), nullable=True)
    delivery_days = db.Column(db.Integer, nullable=True)
    compliance = db.Column(db.Boolean, nullable=False, default=True)
    extracted_text = db.Column(db.Text, nullable=True)
    # Stored relative path under UPLOAD_FOLDER for traceability
    stored_path = db.Column(db.String(512), nullable=True)
    original_filename = db.Column(db.String(255), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    tender = db.relationship("Tender", back_populates="submissions")
    supplier = db.relationship("Supplier", back_populates="submissions")
    evaluation = db.relationship(
        "Evaluation",
        back_populates="submission",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_text: bool = False):
        data = {
            "id": self.id,
            "tender_id": self.tender_id,
            "supplier_id": self.supplier_id,
            "price": float(self.price) if self.price is not None else None,
            "delivery_days": self.delivery_days,
            "compliance": self.compliance,
            "stored_path": self.stored_path,
            "original_filename": self.original_filename,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_text:
            data["extracted_text"] = self.extracted_text
        return data


class Evaluation(db.Model):
    """Weighted rule-based scores for a single submission."""

    __tablename__ = "evaluations"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(
        db.Integer,
        db.ForeignKey("submissions.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    price_score = db.Column(db.Numeric(6, 3), nullable=False, default=0)
    experience_score = db.Column(db.Numeric(6, 3), nullable=False, default=0)
    delivery_score = db.Column(db.Numeric(6, 3), nullable=False, default=0)
    compliance_score = db.Column(db.Numeric(6, 3), nullable=False, default=0)
    total_score = db.Column(db.Numeric(8, 4), nullable=False, default=0)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    submission = db.relationship("Submission", back_populates="evaluation")

    def to_dict(self):
        return {
            "id": self.id,
            "submission_id": self.submission_id,
            "price_score": float(self.price_score),
            "experience_score": float(self.experience_score),
            "delivery_score": float(self.delivery_score),
            "compliance_score": float(self.compliance_score),
            "total_score": float(self.total_score),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
