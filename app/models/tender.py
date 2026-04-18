"""Tender entity: a procurement opportunity."""

from datetime import datetime, timezone

from app.extensions import db


class Tender(db.Model):
    """Represents a tender / RFP that suppliers can respond to."""

    __tablename__ = "tenders"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    submissions = db.relationship(
        "Submission",
        back_populates="tender",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
