import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from root or backend folder
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Try loading from .env
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")

def _normalize_postgres_url(url: str) -> str:
    """Use psycopg2 driver explicitly."""
    if url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
        return "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "procurement-secret-key-12345")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "procurement-jwt-secret-key-2026-change-me")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    DEFAULT_DATABASE_URL = f"sqlite:///{ROOT_DIR / 'instance' / 'procurement.sqlite3'}"
    SQLALCHEMY_DATABASE_URI = _normalize_postgres_url(
        os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
    )
    
    # Cap upload size (50MB)
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 50 * 1024 * 1024))
    
    # Upload folder
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", str(BASE_DIR / "uploads"))
    TENDERS_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, "tenders")
    PROPOSALS_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, "proposals")
    
    ALLOWED_EXTENSIONS = {"pdf", "docx", "doc"}
