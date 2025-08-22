# FraudGuard — Setup & Operations Guide

AI-powered fraud detection with a React/Vite frontend and a Flask API backend.  
Includes SQLite storage, admin labeling, recent activity views, and auto-retraining on new labels.

---

## Stack
- Frontend: React + TypeScript + Vite (shadcn-ui / Tailwind)
- Backend: Flask (Python), scikit-learn pipeline (`model.joblib`)
- DB:SQLite

---

## 1) Prerequisites
- Node.js 18+ (with npm)
- Python 3.11+
- Git

---

## 2) Quick Start (Windows PowerShell)

### Backend (Flask)
```powershell
# from repo root
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
python app.py
# → http://127.0.0.1:5000

# new terminal, repo root
npm install
npm run dev
# → http://localhost:8080


# Backend
DB_URL=sqlite:///fraud.db
FLASK_ENV=development
SECRET_KEY=change_me

# Frontend (only needed for production builds)
# VITE_API_BASE=https://your-api.example.com
# VITE_ADMIN_TOKEN=dev-admin


4) Using the App
Pages

Home (/): submit transaction (step, amount, age, gender, category) → get fraud probability.

Recent (/recent): latest predictions and labels from DB.

Admin Labels (/admin/labels): label a transaction (Fraud/Legit) + Quick Seed to create test rows fast.

Admin actions

Save Label: enter transaction ID + choose label.

Quick Seed: create n synthetic labeled rows with a fraud ratio; helps reach retrain threshold quickly.

Troubleshooting

Frontend 404 / blank page: ensure Vite runs on http://localhost:8080.

API calls failing: confirm Flask at http://127.0.0.1:5000 and Vite proxy entries include /dev as well.

Auth error (“useAuth must be used within an AuthProvider”): ensure main.tsx wraps <App /> with <AuthProvider>.

Missing packages (e.g., lucide-react):
npm i lucide-react @radix-ui/react-select class-variance-authority tailwind-merge @radix-ui/react-slot.

---

## Test datasets

Two sample CSV files are included for quick testing:

- `Fraud_test_cases__sample_.csv`
- `Legit_test_cases__sample_.csv`

Example: load a CSV into the local SQLite `fraud.db` using pandas:

```powershell
.\.venv\Scripts\Activate.ps1
python - << 'PY'
import pandas as pd
from sqlalchemy import create_engine

df = pd.read_csv('Fraud_test_cases__sample_.csv')
engine = create_engine('sqlite:///fraud.db')
# write to table 'predictions' (append) - change if your schema differs
df.to_sql('predictions', engine, if_exists='append', index=False)
print('Imported rows:', len(df))
PY
```

Use similar steps for `Legit_test_cases__sample_.csv` and adapt column names to your DB schema.