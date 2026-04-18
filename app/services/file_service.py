"""Save uploads and dispatch by file type."""

from __future__ import annotations

import os
from pathlib import Path

from werkzeug.datastructures import FileStorage

from app.utils.helpers import build_stored_filename, ensure_directory, extension_of


class FileService:
    """Handles persistence of uploaded tender documents."""

    def __init__(self, upload_root: str):
        self.upload_root = upload_root
        ensure_directory(self.upload_root)

    def detect_kind(self, filename: str) -> str:
        """Return logical kind: pdf | docx | excel."""
        ext = extension_of(filename)
        if ext == "pdf":
            return "pdf"
        if ext == "docx":
            return "docx"
        if ext in ("xlsx", "xls"):
            return "excel"
        raise ValueError(f"Unsupported file extension: {ext or '(none)'}")

    def save_upload(self, file: FileStorage) -> tuple[str, str]:
        """
        Persist file under upload_root.

        Returns (absolute_path, relative_path_from_upload_root).
        """
        if not file.filename:
            raise ValueError("Missing filename on upload")
        stored_name = build_stored_filename(file.filename)
        abs_path = os.path.join(self.upload_root, stored_name)
        file.save(abs_path)
        rel = stored_name
        return abs_path, rel

    def full_path(self, relative_path: str) -> str:
        return str(Path(self.upload_root) / relative_path)
