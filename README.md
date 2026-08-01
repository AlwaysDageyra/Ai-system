# TenderRank — AI-Powered Procurement Evaluation System

TenderRank is a full-stack web application that digitises government and NGO procurement. Procurement officers create and publish tenders, suppliers submit proposal documents, and the AI pipeline automatically evaluates every proposal against the tender requirements and produces a ranked shortlist.

---

## Table of Contents

1. [How the System Works](#how-the-system-works)
2. [The AI Pipeline](#the-ai-pipeline)
3. [User Roles](#user-roles)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Step-by-Step Setup](#step-by-step-setup)
7. [Environment Variables](#environment-variables)
8. [Database](#database)
9. [Running the Project](#running-the-project)
10. [Default Accounts](#default-accounts)
11. [API Health Check](#api-health-check)

---

## How the System Works

The system has three stages:

### Stage 1 — Tender Creation (Admin)
1. A **Procurement Officer (Admin)** logs in and creates a new tender.
2. They fill in the title, sector, deadline, and optionally upload a **PDF specification document**.
3. The backend saves the tender as a **draft** and immediately launches a background thread.
4. The background thread extracts the raw text from the PDF, runs it through the **RoBERTa classifier** to identify requirement sentences, and stores each requirement in the database.
5. The admin reviews the extracted requirements, then **submits the tender for approval**.

### Stage 2 — Approval (Super Admin)
1. The **Super Admin** sees all pending tenders in an Approval Queue.
2. They can approve or reject each tender with an optional reason.
3. Approved tenders are **published to the public browse page** where any visitor (including suppliers) can see them.

### Stage 3 — Proposal Submission (Supplier)
1. A **Supplier** browses the public tenders page and clicks View Details.
2. They log in and upload their **company proposal document** (PDF or DOCX).
3. The backend saves the proposal and immediately launches a background thread.
4. The background thread:
   - Extracts text from the proposal document
   - Encodes every requirement and every supplier sentence as a vector using **sentence-transformers**
   - Compares each requirement against all supplier sentences using **cosine similarity**
   - Assigns a status to each requirement: **Met** (≥ 0.50), **Partial** (0.35–0.50), or **Not Met** (< 0.35)
   - Runs **negation detection** — phrases like "no experience", "not licensed", "not certified" downgrade a match to Not Met
   - Checks **mandatory requirements** — if a requirement containing keywords like "license", "registration", "tax compliance" receives Not Met, the supplier is **disqualified**
   - Calculates a final score: `(Met + Partial × 0.5) ÷ Total Requirements × 100%`
5. The score and per-requirement breakdown are saved to the database.

### Stage 4 — Ranking (Admin)
1. The Procurement Officer views the Rankings page for their tender.
2. All proposals are **sorted by score**, highest first.
3. They can drill into any proposal to see the full compliance breakdown — which requirements were met, which were partial, and which were missed.

---

## The AI Pipeline

The system uses two local ML models loaded once at startup:

### 1. RoBERTa Requirement Classifier
- **Model**: Fine-tuned `RobertaForSequenceClassification` (binary)
- **Location**: `models/roberta_tender_model/`
- **What it does**: Reads every sentence in a tender PDF and classifies it as a **requirement (label 1)** or **not a requirement (label 0)**
- **Threshold**: Probability ≥ 0.5 → classified as a requirement
- **Input**: Raw text sentence, max 128 tokens
- **Mandatory detection**: If the requirement text contains words like "license", "registration", "tax compliance", it is flagged as mandatory (failing it = disqualification)

### 2. Sentence-Transformers Supplier Matcher
- **Model**: `all-MiniLM-L6-v2` (downloaded automatically from HuggingFace on first run, ~90MB, cached after)
- **What it does**: Encodes requirements and supplier sentences into dense vectors, then uses **cosine similarity** to find how well each requirement is addressed in the supplier's proposal
- **Scoring**: Met ≥ 0.50 | Partial 0.35–0.50 | Not Met < 0.35

If either model fails to load, the system falls back to keyword matching so the application remains functional.

---

## User Roles

| Role | Access |
|---|---|
| `super_admin` | Approves/rejects tenders, manages all users, sees everything |
| `admin` | Creates and manages their own tenders, reviews proposals submitted to their tenders, sees supplier scores |
| `supplier` | Browses public tenders, submits one proposal per tender, views their own submission status |

---

## Project Structure

```
ai-system/
│
├── backend/                        # Flask API
│   ├── app.py                      # App factory — loads models, registers blueprints
│   ├── config.py                   # Config class (reads from .env)
│   ├── extensions.py               # SQLAlchemy + Migrate instances
│   ├── models/
│   │   ├── User.py                 # User model (all three roles)
│   │   ├── Tender.py               # Tender model + approval workflow
│   │   ├── Proposal.py             # Supplier proposal model
│   │   ├── Requirement.py          # TenderRequirement + ProposalRequirement
│   │   └── ContactMessage.py
│   ├── routes/
│   │   ├── auth.py                 # /api/login, /api/register, JWT helpers
│   │   ├── tenders.py              # CRUD tenders, public browse, approval
│   │   ├── proposals.py            # Submit proposals, background scoring thread
│   │   ├── rankings.py             # Ranked proposal list per tender
│   │   ├── admin.py                # Super admin user management
│   │   └── contact.py
│   └── services/
│       ├── compliance_checker.py   # extract_text(), extract_requirements(), match_supplier()
│       ├── ai_requirement_service.py  # Keyword fallback when model not loaded
│       ├── ranking_service.py
│       └── scoring_service.py
│
├── frontend/                       # React 19 + Vite
│   └── src/
│       ├── App.jsx                 # Router + auth guard
│       ├── services/api.js         # Axios client (base URL, JWT interceptor)
│       └── pages/
│           ├── Login.jsx
│           ├── HomePage.jsx            # Public landing page
│           ├── PublicTenders.jsx       # Public tender browse (/browse)
│           ├── PublicTenderDetail.jsx  # Single tender view (/browse/:tenderId)
│           ├── Dashboard.jsx           # Admin dashboard
│           ├── TendersList.jsx         # Admin — My Tenders
│           ├── TenderDetails.jsx       # Admin — single tender + proposals
│           ├── CreateTender.jsx        # Admin — create tender form
│           ├── ApprovalQueue.jsx       # Super Admin — approve/reject tenders
│           ├── SuperAdminDashboard.jsx
│           ├── UserManagement.jsx      # Super Admin — manage all users
│           ├── SupplierDashboard.jsx
│           ├── SupplierSubmission.jsx  # Supplier — submit proposal
│           ├── ProposalDetails.jsx     # Compliance breakdown for one proposal
│           └── Rankings.jsx            # Ranked list for a tender
│
├── migrations/                     # Alembic DB migrations (run in order)
├── models/
│   └── roberta_tender_model/       # ← PUT THE MODEL HERE (not in git, share separately)
│       ├── config.json
│       ├── model.safetensors
│       ├── tokenizer.json
│       └── tokenizer_config.json
│
├── run_backend.py                  # Backend entry point
├── requirements.txt                # Python dependencies
├── .env.example                    # Copy this to .env and fill in values
└── .gitignore
```

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| npm | 9+ | Frontend package manager |
| Git | any | Clone the repo |

> **Windows users**: Use **PowerShell** for all commands below.  
> **Mac/Linux users**: Use your regular terminal; replace `.venv\Scripts\` with `.venv/bin/`.

---

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd ai-system
```

---

### 2. Get the ML Model

The model file (`model.safetensors`) is 475MB — too large for git. Get it from the project owner and place it at:

```
ai-system/
└── models/
    └── roberta_tender_model/
        ├── config.json
        ├── model.safetensors      ← this file comes from the owner
        ├── tokenizer.json
        └── tokenizer_config.json
```

Create the folder if it doesn't exist:
```bash
mkdir -p models/roberta_tender_model
```
Then copy the files into it.

---

### 3. Create the Python Virtual Environment

```bash
python -m venv .venv
```

Activate it:

**Windows (PowerShell)**
```powershell
.venv\Scripts\Activate.ps1
```

**Mac / Linux**
```bash
source .venv/bin/activate
```

You should see `(.venv)` at the start of your prompt.

---

### 4. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, SQLAlchemy, transformers, torch, sentence-transformers, pdfplumber, python-docx, and everything else the backend needs.

> **Note**: `torch` is a large download (~2GB). This is a one-time install.

---

### 5. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env       # Mac / Linux
copy .env.example .env     # Windows
```

Open `.env` in any text editor and fill in:

```env
FLASK_ENV=development
FLASK_APP=run_backend:app

SECRET_KEY=change-this-to-a-long-random-string
JWT_SECRET_KEY=change-this-to-another-long-random-string

UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=52428800

MODEL_PATH=models/roberta_tender_model
```

> **Important**: `SECRET_KEY` and `JWT_SECRET_KEY` must be long, random strings in production. You can generate one with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

### 6. Set Up the Database

Run all migrations to create every table:

```bash
flask db upgrade
```

This creates `instance/procurement.sqlite3` with the full schema.

> **Using PostgreSQL instead?** See the [Database](#database) section below.

---

### 7. Seed Default Accounts

Create the initial Super Admin and Admin accounts:

```bash
flask seed-db
```

This creates:

| Email | Password | Role |
|---|---|---|
| `superadmin@tender.com` | `superadminpass` | Super Admin |
| `admin@tender.com` | `adminpass` | Procurement Officer |
| `supplier@tender.com` | `supplierpass` | Supplier |

> Change these passwords immediately after your first login.

---

### 8. Install Frontend Dependencies

Open a **second terminal** (keep the virtual environment active in the first one):

```bash
cd frontend
npm install
```

---

### 9. Start the Backend

In your first terminal (with `.venv` active), from the project root:

```bash
python run_backend.py
```

You should see:

```
[ML] RoBERTa loaded from .../models/roberta_tender_model
[ML] SentenceTransformer (all-MiniLM-L6-v2) loaded
 * Running on http://127.0.0.1:5000
```

> On first run, `all-MiniLM-L6-v2` is downloaded from HuggingFace (~90MB). This only happens once — it is cached locally afterward.

---

### 10. Start the Frontend

In your second terminal:

```bash
cd frontend
npm run dev
```

Vite will print a URL like `http://localhost:5173`. Open that in your browser.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | Flask session secret |
| `JWT_SECRET_KEY` | ✅ | Signs JWT tokens for auth |
| `MODEL_PATH` | ✅ | Path to the RoBERTa model folder |
| `DATABASE_URL` | ❌ | PostgreSQL URL (omit for SQLite) |
| `FLASK_ENV` | ❌ | `development` or `production` |
| `UPLOAD_FOLDER` | ❌ | Where uploaded files are stored (default: `uploads/`) |
| `MAX_CONTENT_LENGTH` | ❌ | Max upload size in bytes (default: 50MB) |

---

## Database

### Default — SQLite (no setup needed)
The app uses SQLite by default. The database file is created automatically at `instance/procurement.sqlite3` when you run `flask db upgrade`.

### Production — PostgreSQL

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE procurement;
   CREATE USER procurement WITH PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE procurement TO procurement;
   ```

2. Add to your `.env`:
   ```env
   DATABASE_URL=postgresql://procurement:yourpassword@127.0.0.1:5432/procurement
   ```

3. Run migrations:
   ```bash
   flask db upgrade
   flask seed-db
   ```

---

## Running the Project

Every time you want to run the project after the initial setup:

**Terminal 1 — Backend**
```bash
# From the project root, with .venv active
python run_backend.py
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Default Accounts

After running `flask seed-db`:

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@tender.com` | `superadminpass` |
| Procurement Officer | `admin@tender.com` | `adminpass` |
| Supplier | `supplier@tender.com` | `supplierpass` |

---

## API Health Check

With the backend running, open `http://127.0.0.1:5000/api/status` in your browser. You should see:

```json
{
  "mode": "RoBERTa + sentence-transformers (full pipeline)",
  "roberta": { "loaded": true },
  "sentence_transformer": { "loaded": true, "model": "all-MiniLM-L6-v2" }
}
```

If `loaded` is `false` for either model, check that:
- The model folder exists at the path set in `MODEL_PATH`
- All four model files are present (`config.json`, `model.safetensors`, `tokenizer.json`, `tokenizer_config.json`)
- All pip dependencies installed correctly (`pip install -r requirements.txt`)
