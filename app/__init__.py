"""Flask application factory."""

import os

from flask import Flask, jsonify
from sqlalchemy import select

from app.config import get_config
from app.extensions import db, migrate
from app.routes import register_blueprints


def create_app(config_name: str | None = None) -> Flask:
    """Application entry point used by WSGI servers and the CLI."""
    app = Flask(__name__)
    config_class = get_config(config_name or os.environ.get("FLASK_ENV"))
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    register_blueprints(app)
    _register_error_handlers(app)
    _register_cli(app)

    @app.get("/health")
    def health():
        """Lightweight readiness probe for orchestrators."""
        return jsonify({"status": "ok"})

    return app


def _register_error_handlers(app: Flask) -> None:
    """Return consistent JSON errors instead of HTML defaults."""

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"error": "not_found", "message": "Resource not found"}), 404

    @app.errorhandler(413)
    def too_large(_e):
        return jsonify({"error": "payload_too_large", "message": "Uploaded file exceeds limit"}), 413

    @app.errorhandler(500)
    def server_error(_e):
        return jsonify({"error": "server_error", "message": "Internal server error"}), 500


def _register_cli(app: Flask) -> None:
    """Developer ergonomics: create schema rows without a separate REST client."""

    @app.cli.command("seed-demo")
    def seed_demo():
        """Insert a sample tender and two suppliers for local testing."""
        from app.models.supplier import Supplier
        from app.models.tender import Tender

        with app.app_context():
            if not db.session.scalars(select(Tender).limit(1)).first():
                db.session.add(
                    Tender(
                        title="Sample IT Services Framework",
                        description="Demonstration tender for local development.",
                    )
                )
            if not db.session.scalars(select(Supplier).where(Supplier.name == "Acme Ltd")).first():
                db.session.add(
                    Supplier(
                        name="Acme Ltd",
                        years_experience=8,
                        past_projects="National payroll modernization",
                    )
                )
            if not db.session.scalars(select(Supplier).where(Supplier.name == "Contoso")).first():
                db.session.add(
                    Supplier(
                        name="Contoso",
                        years_experience=12,
                        past_projects="ERP rollout for regional government",
                    )
                )
            db.session.commit()
            print("seed-demo: ensured baseline tender and suppliers exist.")
