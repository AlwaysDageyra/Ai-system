# TenderRank procurement evaluation system

TenderRank is a Flask + React tender ranking system. Admin users create tenders, suppliers upload proposal PDFs, the backend extracts document requirements, scores compliance, and ranks proposals by score.

## Project layout

- `backend/` - Flask API, SQLAlchemy models, PDF extraction, scoring, ranking.
- `frontend/` - React/Vite UI.
- `run_backend.py` - backend entry point.
- `migrations/` - Alembic migration for the current schema.

## Quick start on Windows PowerShell

### 1. Backend

```powershell
cd C:\Users\pc\ai-system
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:FLASK_APP = "run_backend:app"
flask init-db
flask seed-db
python run_backend.py
```

The API runs at `http://127.0.0.1:5000`.

Demo users:

- Admin: `admin@tender.com` / `adminpass`
- Supplier: `supplier@tender.com` / `supplierpass`

By default the app uses SQLite at `instance/procurement.sqlite3`. To use PostgreSQL, set `DATABASE_URL` in `.env`, for example:

```text
DATABASE_URL=postgresql://procurement:admin1212@127.0.0.1:5432/procurement
```

Then run:

```powershell
$env:FLASK_APP = "run_backend:app"
flask db upgrade
flask seed-db
```

### 2. Frontend

Open a second PowerShell window:

```powershell
cd C:\Users\pc\ai-system\frontend
npm install
npm run dev
```

The UI runs at the URL printed by Vite, usually `http://localhost:5173`.

## Verification

Backend sanity checks:

```powershell
.\.venv\Scripts\python.exe -m compileall backend
$env:FLASK_APP = "run_backend:app"
flask init-db
flask seed-db
```

Frontend sanity check:

```powershell
cd frontend
npm run build
```
