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

    # Company / organisation profile (shared by supplier and admin roles)
    company_name = db.Column(db.String(255), nullable=True)
    company_type = db.Column(db.String(100), nullable=True)
    registration_number = db.Column(db.String(100), nullable=True)
    year_established = db.Column(db.Integer, nullable=True)
    country = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    address = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    contact_person = db.Column(db.String(255), nullable=True)
    business_description = db.Column(db.Text, nullable=True)
    main_services = db.Column(db.Text, nullable=True)
    industry = db.Column(db.String(100), nullable=True)
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
            "company_type": self.company_type,
            "registration_number": self.registration_number,
            "year_established": self.year_established,
            "country": self.country,
            "city": self.city,
            "address": self.address,
            "phone": self.phone,
            "contact_person": self.contact_person,
            "business_description": self.business_description,
            "main_services": self.main_services,
            "industry": self.industry,
            "website": self.website,
        }
