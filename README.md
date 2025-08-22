# fraudguard-dash

Full-stack fraud-detection dashboard built with a React + Vite frontend and a small Python API for model prediction and data tasks.

## Quick links
- Repo: https://github.com/zaina-almohtaseb/fraudguard-dash

## What you'll find
- Frontend: TypeScript + React + Vite in `src/` (shadcn-ui + Tailwind)
- Backend: minimal Flask API entrypoints in `api_server.py` / `app.py` for model inference
- Models: `model.joblib`, `model_pipeline.pkl`, `fraud_model.joblib` (pretrained artifacts)
- Data / DB: `fraud.db`, `fraudguard.db` (SQLite used for demo data)

## Requirements
- Node.js (v18+) and npm/yarn/pnpm for frontend
- Python 3.11+ and the packages in `requirements.txt` for the API

## Quick start (dev)
1. Create and activate Python virtualenv, install Python deps:

    ```powershell
    python -m venv .venv; .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    ```

2. Install frontend deps and start the dev server in a second terminal:

    ```powershell
    npm install
    npm run dev
    ```

3. Run the API (example):

    ```powershell
    # activate same .venv as above
    python api_server.py
    ```

## Test datasets

This repo includes two sample CSV files for quick local testing of model predictions:

- `Fraud_test_cases__sample_.csv` — sample transactions labeled as fraud (use for testing detection).
- `Legit_test_cases__sample_.csv` — sample legitimate transactions.

Quick usage (Python):

```powershell
.\.venv\Scripts\Activate.ps1
python -c "import pandas as pd; df = pd.read_csv('Fraud_test_cases__sample_.csv'); print(df.head())"
```

You can use these files to seed the local SQLite DB, run batch predictions, or as fixtures for tests.

## Notes
- Avoid committing large or sensitive files. `.gitignore` includes `.venv/` and `*.db` entries; if DB files are tracked already, remove them from tracking with `git rm --cached <file>`.
- Check `package.json` scripts for build and lint commands.

See `docs/DOCUMENTATION.md` for full copy-pasteable documentation and deployment notes.
