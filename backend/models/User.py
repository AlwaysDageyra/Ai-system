from backend.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(512), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="supplier") # admin or supplier
    must_change_password = db.Column(db.Boolean, default=False, nullable=False)

    # Supplier company profile
    company_name = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    registration_number = db.Column(db.String(100), nullable=True)
    website = db.Column(db.String(255), nullable=True)

    proposals = db.relationship("Proposal", backref="supplier", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "must_change_password": self.must_change_password,
            "company_name": self.company_name,
            "address": self.address,
            "phone": self.phone,
            "registration_number": self.registration_number,
            "website": self.website,
        }
