"""HTTP blueprints."""

from app.routes.evaluation import evaluation_bp
from app.routes.tenders import tenders_bp
from app.routes.upload import upload_bp


def register_blueprints(app):
    """Attach all API blueprints to the Flask app."""
    app.register_blueprint(upload_bp)
    app.register_blueprint(tenders_bp)
    app.register_blueprint(evaluation_bp)
