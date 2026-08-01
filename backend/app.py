"""Flask application factory."""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.config import Config
from backend.extensions import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── Load RoBERTa requirement classifier ──────────────────
    roberta_path = os.environ.get("MODEL_PATH", "models/roberta_tender_model")
    if not os.path.isabs(roberta_path):
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        roberta_path = os.path.join(project_root, roberta_path)
    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        app.roberta_tokenizer = AutoTokenizer.from_pretrained(roberta_path)
        app.roberta_model = AutoModelForSequenceClassification.from_pretrained(roberta_path)
        app.roberta_model.eval()
        app.logger.info(f"[ML] RoBERTa loaded from {roberta_path}")
    except Exception as e:
        app.roberta_tokenizer = None
        app.roberta_model = None
        app.logger.warning(f"[ML] RoBERTa not loaded: {e}")

    # ── Load sentence-transformers for supplier matching ─────
    try:
        from sentence_transformers import SentenceTransformer
        app.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        app.logger.info("[ML] SentenceTransformer (all-MiniLM-L6-v2) loaded")
    except Exception as e:
        app.sentence_model = None
        app.logger.warning(f"[ML] SentenceTransformer not loaded: {e}")

    # Ensure upload dirs exist
    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config.get("TENDERS_UPLOAD_FOLDER", "backend/uploads/tenders"), exist_ok=True)
    os.makedirs(app.config.get("PROPOSALS_UPLOAD_FOLDER", "backend/uploads/proposals"), exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from backend.routes.auth import auth_bp
    from backend.routes.tenders import tenders_bp
    from backend.routes.proposals import proposals_bp
    from backend.routes.rankings import rankings_bp
    from backend.routes.admin import admin_bp
    from backend.routes.contact import contact_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(tenders_bp)
    app.register_blueprint(proposals_bp)
    app.register_blueprint(rankings_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(contact_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/status")
    def status():
        roberta_ok = getattr(app, 'roberta_model', None) is not None
        sentence_ok = getattr(app, 'sentence_model', None) is not None
        return jsonify({
            "roberta":  {"loaded": roberta_ok, "path": roberta_path},
            "sentence_transformer": {"loaded": sentence_ok, "model": "all-MiniLM-L6-v2"},
            "mode": (
                "RoBERTa + sentence-transformers (full pipeline)" if roberta_ok and sentence_ok
                else "partial — check logs"
            ),
        })

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        upload_folder = os.path.abspath(app.config.get("UPLOAD_FOLDER", "uploads"))
        return send_from_directory(upload_folder, filename)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return response

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"message": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        import traceback
        app.logger.error(f"500 error: {e}\n{traceback.format_exc()}")
        return jsonify({"message": "Internal server error", "detail": str(e)}), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        import traceback
        app.logger.error(f"Unhandled exception: {e}\n{traceback.format_exc()}")
        return jsonify({"message": str(e)}), 500

    @app.cli.command("seed-db")
    def seed_db():
        """Seed initial database for local testing."""
        from backend.models.User import User
        from backend.models.Tender import Tender
        from backend.models.Requirement import TenderRequirement

        super_admin = User.query.filter_by(email="superadmin@tender.com").first()
        if not super_admin:
            super_admin = User(name="Super Administrator", email="superadmin@tender.com", role="super_admin")
            super_admin.set_password("superadminpass")
            db.session.add(super_admin)
            print("Super Admin seeded: superadmin@tender.com / superadminpass")

        admin = User.query.filter_by(email="admin@tender.com").first()
        if not admin:
            admin = User(name="Tender Administrator", email="admin@tender.com", role="admin")
            admin.set_password("adminpass")
            db.session.add(admin)
            print("Admin seeded: admin@tender.com / adminpass")

        supplier = User.query.filter_by(email="supplier@tender.com").first()
        if not supplier:
            supplier = User(name="Global Supplier Inc.", email="supplier@tender.com", role="supplier")
            supplier.set_password("supplierpass")
            db.session.add(supplier)
            print("Supplier seeded: supplier@tender.com / supplierpass")

        tender = Tender.query.filter_by(title="Solar Farm Installation").first()
        if not tender:
            tender = Tender(
                title="Solar Farm Installation",
                description="A demo solar installation project requiring corporate profile, tax compliance, and bank statement."
            )
            db.session.add(tender)
            db.session.flush()
            for req_name in ["COMPANY_PROFILE", "TAX_COMPLIANCE", "BANK_STATEMENT"]:
                db.session.add(TenderRequirement(tender_id=tender.id, requirement_name=req_name))
            print("Demo tender seeded: Solar Farm Installation")

        db.session.commit()
        print("Seeding complete.")

    @app.cli.command("init-db")
    def init_db():
        """Create all database tables for local development."""
        import backend.models  # noqa: F401

        db.create_all()
        print("Database tables created.")

    @app.cli.command("seed-demo")
    def seed_demo():
        """Alias for seed-db, matching the README."""
        seed_db()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
