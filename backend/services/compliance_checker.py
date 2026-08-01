"""
Procurement compliance checker.

Tender side:
  1. Extract text (pdfplumber / python-docx)
  2. Find requirements section via keyword list
  3. Segment into text units
  4. RoBERTa binary classifier — label 1 = requirement (threshold 0.5)

Supplier side:
  1. Extract text from supplier document
  2. Encode requirements + supplier sentences with all-MiniLM-L6-v2
  3. Cosine similarity → Met ≥0.50 / Partial 0.35–0.50 / Not Met <0.35
  4. Negation detection — downgrade to Not Met
  5. Mandatory check — disqualify if Not Met on license/registration/tax
  6. Score = (Met + Partial×0.5) / Total × 100%
"""

import re
from pathlib import Path

try:
    import pdfplumber
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

try:
    from docx import Document as DocxDocument
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False


REQUIREMENTS_SECTION_KEYWORDS = [
    'requirements', 'eligibility', 'criteria', 'mandatory', 'qualification',
    'experience required', 'documentation', 'documents required',
    'minimum requirements', 'technical requirements', 'financial requirements',
    'conditions', 'must', 'shall',
]

MANDATORY_KEYWORDS = [
    'license', 'licence', 'registration', 'tax compliance', 'tax clearance',
    'business registration', 'certified', 'certification', 'permit',
    'authority', 'mandatory', 'compulsory', 'required by law',
]

NEGATION_PHRASES = [
    'no experience', 'not licensed', 'not certified', 'not registered',
    'no license', 'no licence', 'no registration', 'not qualified',
    'no certification', 'lack of', 'unable to', 'do not have',
    'does not have', 'without certification', 'without license',
]


# ─────────────────────────────────────────────────────────────
# TEXT EXTRACTION
# ─────────────────────────────────────────────────────────────

def extract_text(file_path):
    ext = Path(file_path).suffix.lower()
    if ext == '.pdf':
        if not PDF_SUPPORT:
            raise ImportError("pdfplumber not installed. Run: pip install pdfplumber")
        with pdfplumber.open(file_path) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages).strip()
    elif ext in ('.docx', '.doc'):
        if not DOCX_SUPPORT:
            raise ImportError("python-docx not installed. Run: pip install python-docx")
        doc = DocxDocument(file_path)
        parts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells if c.text.strip()]
                if cells:
                    parts.append(" | ".join(cells))
        return "\n".join(parts)
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file type: {ext}")


# ─────────────────────────────────────────────────────────────
# TEXT SEGMENTATION
# ─────────────────────────────────────────────────────────────

def _find_requirements_section(text):
    """Return the part of the text starting from the first requirements-like heading."""
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if any(kw in line.lower() for kw in REQUIREMENTS_SECTION_KEYWORDS):
            return "\n".join(lines[i:])
    return text  # fallback: use full document


def _segment(text):
    """Split text into candidate units (min 5 words each)."""
    raw = re.split(r'\n+|(?<=[.!?])\s+', text)
    return [u.strip() for u in raw if u.strip() and len(u.split()) >= 5]


# ─────────────────────────────────────────────────────────────
# TENDER SIDE — RoBERTa requirement extraction
# ─────────────────────────────────────────────────────────────

def extract_requirements(roberta_model, tokenizer, text, threshold=0.5):
    """
    Classify each text unit as requirement (label 1) or not (label 0).
    Returns list of dicts: {text, confidence, is_mandatory}
    """
    import torch

    section = _find_requirements_section(text)
    units = _segment(section)
    if not units:
        return []

    results = []
    for unit in units:
        inputs = tokenizer(
            unit,
            max_length=128,
            padding='max_length',
            truncation=True,
            return_tensors='pt',
        )
        with torch.no_grad():
            outputs = roberta_model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1).cpu().numpy()[0]

        prob_req = float(probs[1])
        if prob_req >= threshold:
            is_mandatory = any(kw in unit.lower() for kw in MANDATORY_KEYWORDS)
            results.append({
                'text':         unit,
                'confidence':   round(prob_req, 4),
                'is_mandatory': is_mandatory,
            })

    return results


# ─────────────────────────────────────────────────────────────
# SUPPLIER SIDE — sentence-transformers matching
# ─────────────────────────────────────────────────────────────

def match_supplier(sentence_model, requirements, supplier_text):
    """
    Match supplier document against a list of requirements.

    Args:
        sentence_model   SentenceTransformer instance
        requirements     list of dicts {text, is_mandatory, ...} OR plain strings
        supplier_text    full text of supplier proposal

    Returns:
        items           list of per-requirement result dicts
        total_score     float 0–100
        disqualified    bool
        disq_reasons    list of str
    """
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    if not requirements or not supplier_text:
        return [], 0.0, False, []

    supplier_sentences = _segment(supplier_text)
    if not supplier_sentences:
        return [], 0.0, False, []

    req_texts = [r['text'] if isinstance(r, dict) else r for r in requirements]
    req_embeddings = sentence_model.encode(req_texts)
    sup_embeddings = sentence_model.encode(supplier_sentences)

    items = []
    total_weight = len(requirements)
    total_earned = 0.0
    disqualified = False
    disq_reasons = []

    for i, req in enumerate(requirements):
        req_text = req['text'] if isinstance(req, dict) else req
        is_mandatory = req.get('is_mandatory', False) if isinstance(req, dict) else False

        sims = cosine_similarity([req_embeddings[i]], sup_embeddings)[0]
        best_idx = int(np.argmax(sims))
        best_score = float(sims[best_idx])
        best_sentence = supplier_sentences[best_idx]

        # Negation detection
        if any(phrase in best_sentence.lower() for phrase in NEGATION_PHRASES):
            best_score = 0.0

        if best_score >= 0.50:
            status = 'Met'
            total_earned += 1.0
        elif best_score >= 0.35:
            status = 'Partial'
            total_earned += 0.5
        else:
            status = 'Not Met'
            if is_mandatory:
                disqualified = True
                disq_reasons.append(req_text[:100])

        items.append({
            'requirement_text': req_text,
            'status':           status,
            'similarity':       round(best_score, 4),
            'best_match':       best_sentence[:200],
            'is_mandatory':     is_mandatory,
        })

    score = round(total_earned / total_weight * 100, 1) if total_weight > 0 else 0.0
    return items, score, disqualified, disq_reasons
