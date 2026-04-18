"""Supplier entity."""

from app.extensions import db


class Supplier(db.Model):
    """A vendor that can submit responses to tenders."""

    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    years_experience = db.Column(db.Integer, nullable=False, default=0)
    past_projects = db.Column(db.Text, nullable=True)

    submissions = db.relationship(
        "Submission",
        back_populates="supplier",
        lazy="dynamic",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "years_experience": self.years_experience,
            "past_projects": self.past_projects,
        }
