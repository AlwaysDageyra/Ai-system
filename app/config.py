"""Application configuration loaded from environment variables."""

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    _env_file = Path(__file__).resolve().parent.parent / ".env"
    # Must run before reading os.environ below. override=True so a stale DATABASE_URL in the
    # shell or Windows user environment does not shadow values from .env during local dev.
    if _env_file.is_file():
        load_dotenv(_env_file, override=True)
except ImportError:
    pass


def _normalize_postgres_url(url: str) -> str:
    """Use psycopg2 driver explicitly (matches requirements.txt)."""
    if url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
        return "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url


class BaseConfig:
    """Shared defaults; override via env in production."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # PostgreSQL connection string (SQLAlchemy format)
    SQLALCHEMY_DATABASE_URI = _normalize_postgres_url(
        os.environ.get(
            "DATABASE_URL",
            "postgresql+psycopg2://procurement:changeme@127.0.0.1:5432/procurement",
        )
    )
    # Cap upload size (bytes) to protect the server
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 50 * 1024 * 1024))
    _base_dir = Path(__file__).resolve().parent.parent
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", str(_base_dir / "uploads"))
    # Extensions we accept for tender documents
    ALLOWED_EXTENSIONS = frozenset({"pdf", "docx", "xlsx", "xls"})


class DevelopmentConfig(BaseConfig):
    """Local development defaults."""

    DEBUG = True


class ProductionConfig(BaseConfig):
    """Production-oriented defaults."""

    DEBUG = False


def get_config(name: str | None = None):
    """Resolve config class from FLASK_ENV / explicit name."""
    env = (name or os.environ.get("FLASK_ENV") or "development").lower()
    if env == "production":
        return ProductionConfig
    return DevelopmentConfig
