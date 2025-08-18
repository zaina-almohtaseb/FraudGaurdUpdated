# api_server.py
"""
Prediction API for the fraud model trained by train_model.py.

Run:
  uvicorn api_server:app --reload --port 5001

Env (optional):
  FRAUD_MODEL_PATH=./fraud_model.joblib
  API_ALLOW_ORIGINS=*           # CORS
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Literal, Optional

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

# -------------------- Config --------------------
MODEL_PATH = os.environ.get("FRAUD_MODEL_PATH", "fraud_model.joblib")
REPORT_PATH = os.environ.get("TRAINING_REPORT_PATH", "training_report.json")

EXPECTED_FEATURES = ["step", "amount", "age", "gender", "category"]  # inputs accepted by this API
CAT_FEATURES = ["age", "gender", "category", "period"]               # inside the pipeline
NUM_FEATURES = ["amount", "hour"]

# -------------------- Helpers --------------------
def _period_from_hour(h: int) -> str:
    if 5 <= h < 12:
        return "Morning"
    if 12 <= h < 17:
        return "Afternoon"
    if 17 <= h < 21:
        return "Evening"
    return "Night"

def _safe_load_joblib(path: str):
    if not os.path.exists(path):
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None

def _now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"

# -------------------- I/O Schemas --------------------
class PredictIn(BaseModel):
    step: int = Field(ge=0, description="Time step in hours")
    amount: float = Field(ge=0, description="Transaction amount")
    age: str = Field(description="Categorical age bucket, e.g. '0','1','2','3','4','5','6','U'")
    gender: str = Field(description="Categorical gender, e.g. 'M','F','U','E'")
    category: str = Field(description="Merchant category string")

    @validator("age", "gender", "category")
    def strip_lower_ok(cls, v: str) -> str:
        # Keep original tokens but trim whitespace
        return (v or "").strip()

class PredictOut(BaseModel):
    id: int
    probability_fraud: float
    prediction: float
    step: int
    amount: float
    age: str
    gender: str
    category: str
    hour: int
    period: str
    timestamp: str

class StatusOut(BaseModel):
    last_trained: Optional[str] = None
    features: list[str] = []
    retrain_threshold: int = 100
    new_labeled: int = 0
    performance_metric: float = 0.0
    training_samples: int = 0

class MetricsOut(BaseModel):
    total_transactions: int = 0
    labeled_transactions: int = 0
    fraud_ratio: float = 0.0
    class_0: int = 0
    class_1: int = 0

# -------------------- App --------------------
app = FastAPI(title="Fraud Detection API", version="1.0.0")

allow_origins = os.environ.get("API_ALLOW_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allow_origins.split(",")] if allow_origins != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = _safe_load_joblib(MODEL_PATH)
_next_id = 1  # simple in-memory id for responses

# -------------------- Routes --------------------
@app.get("/health")
def health():
    return {"status": "ok", "model_present": bool(model), "model_path": MODEL_PATH}

@app.get("/model/status", response_model=StatusOut)
def model_status():
    # Provide safe defaults; fill from training_report.json if present
    status = StatusOut(
        last_trained=None,
        features=EXPECTED_FEATURES,
        retrain_threshold=100,
        new_labeled=0,
        performance_metric=0.0,
        training_samples=0,
    )
    if os.path.exists(REPORT_PATH):
        try:
            import json
            with open(REPORT_PATH, "r", encoding="utf-8") as f:
                rep = json.load(f)
            status.last_trained = rep.get("timestamp")
            status.features = rep.get("features", {}).get("expected_api_fields", EXPECTED_FEATURES)
            status.performance_metric = float(rep.get("metrics", {}).get("auc") or 0.0)
            # If you later store counts in the report, surface them here:
            # status.training_samples = rep.get("data", {}).get("n_rows", 0)
        except Exception:
            pass
    return status

@app.get("/model/metrics", response_model=MetricsOut)
def model_metrics():
    # If you add a database later, compute real counts here.
    # For now, return zeros so the UI renders sanely.
    return MetricsOut()

@app.post("/predict", response_model=PredictOut)
def predict(payload: PredictIn):
    global _next_id, model

    # Cold start: if model not present, return neutral probability
    prob = 0.5
    hour = int(payload.step % 24)
    period = _period_from_hour(hour)

    if model is not None:
        # Build the frame exactly as the pipeline expects
        data = {
            "age": payload.age,
            "gender": payload.gender,
            "category": payload.category,
            "period": period,
            "amount": float(payload.amount),
            "hour": hour,
        }
        df = pd.DataFrame([data], columns=CAT_FEATURES + NUM_FEATURES)
        try:
            prob = float(model.predict_proba(df)[0, 1])
        except Exception:
            # In case of any mismatch, keep safe default prob
            prob = 0.5

    out = PredictOut(
        id=_next_id,
        probability_fraud=prob,
        prediction=prob,
        step=payload.step,
        amount=payload.amount,
        age=payload.age,
        gender=payload.gender,
        category=payload.category,
        hour=hour,
        period=period,
        timestamp=_now_iso(),
    )
    _next_id += 1
    return out

# Entry point for `python api_server.py`
if __name__ == "__main__":
    import uvicorn
    print(f">>> Serving Fraud API on :5001 (model: {MODEL_PATH})")
    uvicorn.run("api_server:app", host="127.0.0.1", port=5001, reload=True)
