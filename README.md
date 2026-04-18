# Procurement tender evaluation API

Production-oriented Flask backend for ingesting tender documents (PDF, DOCX, XLSX), extracting basic structured fields, persisting bids in PostgreSQL, applying transparent rule-based scoring, and ranking suppliers. The design keeps document parsing and scoring behind service layers so ML components can be swapped in later without changing the HTTP contract.

## Requirements

- Python 3.11+ (3.12 is also supported on the versions pinned in `requirements.txt`)
- PostgreSQL 14+ (or compatible)
- Optional: [Tesseract](https://github.com/tesseract-ocr/tesseract) if you later enable OCR paths in `extraction_service.py`

---


### 1. Create role and database

Enter Postgres in window terminal with this command below

psql -U postgres


```sql
CREATE USER procurement WITH PASSWORD 'your_secure_password';
CREATE DATABASE procurement OWNER procurement;
```

```sql
CREATE DATABASE procurement;
```

### 2. Clone the repo and open a terminal in the project root and

```powershell
cd path\to\ai-system
```

### 3. Environment file

```powershell
copy .env.example .env
```

Edit **`.env`**:

| Variable | What to set |
|----------|-------------|
| `DATABASE_URL` | Must match PostgreSQL. Prefer **`127.0.0.1`** on Windows (avoids some `localhost` → IPv6 issues). Example: `postgresql://procurement:your_secure_password@127.0.0.1:5432/procurement` — the app normalizes this to use `psycopg2`. |




**Sanity check:** from a terminal, if `psql` is on your `PATH`:

```text
psql -h 127.0.0.1 -U procurement -d procurement
```

If that fails, fix the role password or `DATABASE_URL` before continuing.

### 4. Python virtual environment and dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If `Activate.ps1` is blocked, run once in an elevated PowerShell (or for the current user only):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 5. Apply database schema

```powershell
$env:FLASK_APP = "run:app"
flask db upgrade
```

### 6. Seed demo data (recommended)

```powershell
flask seed-demo
```
### 7. Start the API

```powershell
python run.py
```

**Base URL for HTTP clients:** `http://127.0.0.1:5000` (override with env var **`PORT`**).
