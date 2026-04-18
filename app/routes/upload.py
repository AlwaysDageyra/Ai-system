"""Upload and ingest tender submission documents."""

from decimal import Decimal

from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models.evaluation import Submission
from app.models.supplier import Supplier
from app.models.tender import Tender
from app.services.extraction_service import ExtractionService
from app.services.file_service import FileService
from app.utils.helpers import extension_of
from app.utils.validators import (
    optional_bool,
    optional_float,
    optional_int,
    require_positive_int,
    validate_upload_file,
)

upload_bp = Blueprint("upload", __name__)


@upload_bp.post("/upload")
def upload_document():
    """
    Accept a tender document, persist it, extract text/fields, and create a Submission.

    Multipart form fields:
    - file (required)
    - tender_id, supplier_id (required)
    - price, delivery_days, compliance (optional overrides for extracted values)
    """
    try:
        tender_id = require_positive_int(request.form.get("tender_id"), "tender_id")
        supplier_id = require_positive_int(request.form.get("supplier_id"), "supplier_id")
        file = validate_upload_file(request.files.get("file"))

        ext = extension_of(file.filename or "")
        if ext not in current_app.config["ALLOWED_EXTENSIONS"]:
            return (
                jsonify(
                    {
                        "error": "unsupported_file_type",
                        "message": f"Extension .{ext} is not allowed",
                    }
                ),
                400,
            )

        tender = db.session.get(Tender, tender_id)
        if tender is None:
            return jsonify({"error": "not_found", "message": "Tender not found"}), 404
        supplier = db.session.get(Supplier, supplier_id)
        if supplier is None:
            return jsonify({"error": "not_found", "message": "Supplier not found"}), 404

        file_service = FileService(current_app.config["UPLOAD_FOLDER"])
        kind = file_service.detect_kind(file.filename or "")
        abs_path, rel_path = file_service.save_upload(file)

        extractor = ExtractionService()
        text = extractor.extract_text(abs_path, kind)
        hints = extractor.parse_fields(text)

        price_override = optional_float(request.form.get("price"))
        delivery_override = optional_int(request.form.get("delivery_days"))
        compliance_override = optional_bool(request.form.get("compliance"))

        price = (
            Decimal(str(price_override))
            if price_override is not None
            else hints.get("price")
        )
        delivery_days = (
            delivery_override if delivery_override is not None else hints.get("delivery_days")
        )
        if compliance_override is not None:
            compliance = compliance_override
        else:
            compliance = hints.get("compliance", True)
            if not isinstance(compliance, bool):
                compliance = True

        submission = Submission(
            tender_id=tender_id,
            supplier_id=supplier_id,
            price=price,
            delivery_days=delivery_days,
            compliance=bool(compliance),
            extracted_text=text,
            stored_path=rel_path,
            original_filename=file.filename,
        )
        db.session.add(submission)
        db.session.commit()

        def _json_safe(value):
            if isinstance(value, Decimal):
                return float(value)
            return value

        return (
            jsonify(
                {
                    "message": "upload_processed",
                    "submission": submission.to_dict(include_text=True),
                    "parsed_hints": {k: _json_safe(v) for k, v in hints.items()},
                }
            ),
            201,
        )

    except ValueError as exc:
        return jsonify({"error": "validation_error", "message": str(exc)}), 400
    except FileNotFoundError as exc:
        return jsonify({"error": "io_error", "message": str(exc)}), 500
    except Exception as exc:  # pragma: no cover - defensive boundary
        current_app.logger.exception("upload_failed")
        return jsonify({"error": "server_error", "message": str(exc)}), 500
