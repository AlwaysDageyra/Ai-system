"""Small filesystem and response helpers."""

import os
import uuid
from pathlib import Path

from werkzeug.utils import secure_filename


def ensure_directory(path: str) -> None:
    """Create directory if missing (idempotent)."""
    Path(path).mkdir(parents=True, exist_ok=True)


def build_stored_filename(original_name: str) -> str:
    """Return a collision-resistant filename while keeping a safe suffix."""
    base = secure_filename(original_name) or "upload"
    stem, suffix = os.path.splitext(base)
    unique = uuid.uuid4().hex[:12]
    return f"{stem}_{unique}{suffix}"


def extension_of(filename: str) -> str:
    """Lowercase extension without dot, or empty string."""
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()
