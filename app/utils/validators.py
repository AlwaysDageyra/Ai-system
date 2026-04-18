"""Request and payload validation helpers."""

from __future__ import annotations

from typing import Any

from werkzeug.datastructures import FileStorage


def require_positive_int(value: Any, field: str) -> int:
    """Parse a positive integer from form/query/JSON."""
    if value is None or value == "":
        raise ValueError(f"{field} is required")
    try:
        n = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} must be a positive integer") from exc
    if n < 1:
        raise ValueError(f"{field} must be a positive integer")
    return n


def optional_bool(value: Any) -> bool | None:
    """Parse common truthy/falsey string representations."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    s = str(value).strip().lower()
    if s in ("1", "true", "yes", "y", "on"):
        return True
    if s in ("0", "false", "no", "n", "off"):
        return False
    raise ValueError("compliance must be a boolean-like value when provided")


def optional_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("price override must be numeric") from exc


def optional_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("delivery_days override must be an integer") from exc


def validate_upload_file(file: FileStorage | None) -> FileStorage:
    if file is None or file.filename is None or file.filename.strip() == "":
        raise ValueError("file is required")
    return file
