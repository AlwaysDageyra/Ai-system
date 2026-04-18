"""
Extract raw text from supported formats, then apply lightweight regex/keyword
parsing for procurement fields. This is intentionally simple so ML can replace
it later without changing the API surface.
"""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import pandas as pd
import pdfplumber
from docx import Document

# Optional OCR hook: kept as a no-op unless pytesseract + images are wired in.
try:
    import pytesseract  # noqa: F401
    from PIL import Image  # noqa: F401

    _HAS_TESSERACT = True
except ImportError:
    _HAS_TESSERACT = False


class ExtractionService:
    """Text extraction + naive field parsing from tender documents."""

    # Currency symbols and keywords near amounts
    _PRICE_PATTERN = re.compile(
        r"(?:price|total|bid|amount|fee|cost)\s*[:\-]?\s*(?:USD|EUR|GBP|£|\$|€)?\s*([\d,]+(?:\.\d{1,2})?)",
        re.IGNORECASE,
    )
    _FALLBACK_MONEY = re.compile(r"(?:£|\$|€)\s*([\d,]+(?:\.\d{1,2})?)")
    _DELIVERY_PATTERN = re.compile(
        r"(?:delivery|lead[-\s]?time|within)\s*[:\-]?\s*(\d+)\s*(?:days?|working\s*days?|wd)",
        re.IGNORECASE,
    )
    _DELIVERY_FALLBACK = re.compile(r"(\d+)\s*(?:calendar\s*)?days?", re.IGNORECASE)
    _EXPERIENCE_PATTERN = re.compile(
        r"(?:experience|years?\s+of\s+experience)\s*[:\-]?\s*(\d+)\+?\s*years?",
        re.IGNORECASE,
    )
    _EXPERIENCE_FALLBACK = re.compile(r"(\d+)\+?\s*years?", re.IGNORECASE)

    def extract_text(self, abs_path: str, kind: str) -> str:
        """Read best-effort plain text from disk based on detected kind."""
        path = Path(abs_path)
        if not path.is_file():
            raise FileNotFoundError(abs_path)

        if kind == "pdf":
            return self._text_from_pdf(abs_path)
        if kind == "docx":
            return self._text_from_docx(abs_path)
        if kind == "excel":
            return self._text_from_excel(abs_path)
        raise ValueError(f"Unknown document kind: {kind}")

    def _text_from_pdf(self, abs_path: str) -> str:
        chunks: list[str] = []
        with pdfplumber.open(abs_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                if t.strip():
                    chunks.append(t)
                # OCR placeholder: if page has no text, future work could rasterize
                # and call pytesseract here when _HAS_TESSERACT is True.
                elif _HAS_TESSERACT:
                    # Deliberately minimal: avoid heavy deps in default path.
                    chunks.append("")
        return "\n\n".join(chunks).strip()

    def _text_from_docx(self, abs_path: str) -> str:
        doc = Document(abs_path)
        return "\n".join(p.text for p in doc.paragraphs if p.text).strip()

    def _text_from_excel(self, abs_path: str) -> str:
        # Flatten visible sheet values into searchable lines for regex.
        frames: list[pd.DataFrame] = pd.read_excel(abs_path, sheet_name=None, dtype=str)
        lines: list[str] = []
        for _, df in frames.items():
            for row in df.itertuples(index=False, name=None):
                lines.extend(str(cell) for cell in row if cell and str(cell).strip())
        return "\n".join(lines).strip()

    def parse_fields(self, text: str) -> dict[str, Any]:
        """
        Pull price, delivery_days, and years_experience hints from free text.

        Returns dict with keys possibly missing when not found.
        """
        result: dict[str, Any] = {}
        if not text:
            return result

        price = self._first_decimal(self._PRICE_PATTERN, text) or self._first_decimal(
            self._FALLBACK_MONEY, text
        )
        if price is not None:
            result["price"] = price

        delivery = self._first_int(self._DELIVERY_PATTERN, text) or self._first_int(
            self._DELIVERY_FALLBACK, text
        )
        if delivery is not None:
            result["delivery_days"] = delivery

        exp = self._first_int(self._EXPERIENCE_PATTERN, text) or self._first_int(
            self._EXPERIENCE_FALLBACK, text
        )
        if exp is not None:
            result["years_experience_hint"] = exp

        # Simple compliance heuristic from keywords
        low = text.lower()
        if "non-compliant" in low or "not compliant" in low or "fail compliance" in low:
            result["compliance"] = False
        elif "compliant" in low or "compliance" in low:
            result["compliance"] = True

        return result

    @staticmethod
    def _first_int(pattern: re.Pattern[str], text: str) -> int | None:
        m = pattern.search(text)
        if not m:
            return None
        try:
            return int(m.group(1).replace(",", ""))
        except (ValueError, IndexError):
            return None

    @staticmethod
    def _first_decimal(pattern: re.Pattern[str], text: str) -> Decimal | None:
        m = pattern.search(text)
        if not m:
            return None
        raw = m.group(1).replace(",", "")
        try:
            return Decimal(raw)
        except (InvalidOperation, ValueError):
            return None
