from flask import Blueprint, request, jsonify, current_app
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from backend.extensions import db
from backend.models.User import User

auth_bp = Blueprint("auth", __name__)

def encode_auth_token(user_id):
    """Generates the Auth Token"""
    try:
        payload = {
            'exp': datetime.now(timezone.utc) + timedelta(days=1),
            'iat': datetime.now(timezone.utc),
            'sub': str(user_id)
        }
        return jwt.encode(
            payload,
            current_app.config.get('JWT_SECRET_KEY'),
            algorithm='HS256'
        )
    except Exception as e:
        return str(e)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            payload = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY'), algorithms=['HS256'])
            current_user = User.query.get(int(payload['sub']))
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def super_admin_required(f):
    """Decorator: token_required + role == super_admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            payload = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY'), algorithms=['HS256'])
            current_user = User.query.get(int(payload['sub']))
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401
        if current_user.role != 'super_admin':
            return jsonify({'message': 'Super Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated


def admin_or_super_required(f):
    """Decorator: token_required + role in (admin, super_admin)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            payload = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY'), algorithms=['HS256'])
            current_user = User.query.get(int(payload['sub']))
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401
        if current_user.role not in ('admin', 'super_admin'):
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.post("/api/register")
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    # Public registration is supplier-only; admin/super_admin created by super_admin
    role = "supplier"

    if not email or not password or not name:
        return jsonify({"message": "Email, password and name are required"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User with this email already exists"}), 400

    new_user = User(name=name, email=email, role=role)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    token = encode_auth_token(new_user.id)
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": new_user.to_dict()
    }), 201

@auth_bp.post("/api/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401

    token = encode_auth_token(user.id)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.get("/api/profile")
@token_required
def get_profile(current_user):
    return jsonify(current_user.to_dict()), 200


@auth_bp.post("/api/auth/change-password")
@token_required
def change_password(current_user):
    data = request.get_json() or {}
    current_password = (data.get("current_password") or "").strip()
    new_password = (data.get("new_password") or "").strip()

    if not current_password or not new_password:
        return jsonify({"message": "current_password and new_password are required"}), 400
    if not current_user.check_password(current_password):
        return jsonify({"message": "Current password is incorrect"}), 400
    if len(new_password) < 8:
        return jsonify({"message": "New password must be at least 8 characters"}), 400
    if current_password == new_password:
        return jsonify({"message": "New password must differ from the current one"}), 400

    current_user.set_password(new_password)
    current_user.must_change_password = False
    db.session.commit()
    return jsonify({"message": "Password changed successfully", "user": current_user.to_dict()}), 200


@auth_bp.patch("/api/profile")
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    allowed = ("name", "company_name", "address", "phone", "registration_number", "website")
    for field in allowed:
        if field in data:
            value = data[field]
            if field == "name" and not (value or "").strip():
                return jsonify({"message": "Name cannot be empty"}), 400
            setattr(current_user, field, value)
    db.session.commit()
    return jsonify(current_user.to_dict()), 200
