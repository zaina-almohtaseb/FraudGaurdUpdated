# train_model.py
"""
Train a fraud detection model from CSV and save a single artifact (preprocessing + model).

Input CSV is expected to have at least:
  step, amount, age, gender, category, fraud
(Other columns like customer/merchant/zipcodeOri/zipMerchant can be present and will be ignored.)

Usage:
  python train_model.py --csv ./fraud - fraud.csv --out fraud_model.joblib

Outputs:
  - fraud_model.joblib     (sklearn pipeline: preprocessing + classifier)
  - training_report.json   (metrics & settings)
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import GradientBoostingClassifier

# Optional: use imbalanced-learn SMOTE (falls back gracefully if not installed)
try:
    from imblearn.pipeline import Pipeline as ImbPipeline
    from imblearn.over_sampling import SMOTE
    HAVE_IMB = True
except Exception:
    from sklearn.pipeline import Pipeline as SkPipeline
    HAVE_IMB = False


def build_preprocessor(cat_cols, num_cols) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
            ("num", StandardScaler(), num_cols),
        ]
    )


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive hour & period from step (step is hours)."""
    df = df.copy()
    # ensure numeric step
    df["step"] = pd.to_numeric(df["step"], errors="coerce")
    df["hour"] = (df["step"] % 24).astype("Int64")

    def period_from_hour(h: float | int) -> str:
        try:
            h = int(h)
        except Exception:
            return "Night"
        if 5 <= h < 12:
            return "Morning"
        if 12 <= h < 17:
            return "Afternoon"
        if 17 <= h < 21:
            return "Evening"
        return "Night"

    df["period"] = df["hour"].apply(period_from_hour)
    return df


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Minimal cleaning aligned to your case study."""
    df = df.copy()

    # Expected columns (case-insensitive mapping)
    # Normalize column names to lowercase for robustness
    df.columns = [c.strip() for c in df.columns]
    lower_map = {c.lower(): c for c in df.columns}

    def col(name: str) -> str:
        # find original-case column by lowercase name
        return lower_map.get(name.lower(), name)

    # Required columns
    required = ["step", "amount", "age", "gender", "category", "fraud"]
    missing = [r for r in required if r.lower() not in lower_map]
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}")

    # Keep only what we need
    keep = [col("step"), col("amount"), col("age"), col("gender"), col("category"), col("fraud")]
    df = df[keep].rename(columns={
        col("step"): "step",
        col("amount"): "amount",
        col("age"): "age",
        col("gender"): "gender",
        col("category"): "category",
        col("fraud"): "fraud",
    })

    # Basic NA handling
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df["step"] = pd.to_numeric(df["step"], errors="coerce")
    df["age"] = df["age"].fillna("U").astype(str)       # 'U' unknown
    df["gender"] = df["gender"].fillna("U").astype(str) # 'U' unknown
    df["category"] = df["category"].fillna("unknown").astype(str)

    # Drop rows without numeric amount/step or target
    df = df.dropna(subset=["amount", "step", "fraud"]).copy()
    # Ensure binary target
    df["fraud"] = pd.to_numeric(df["fraud"], errors="coerce").fillna(0).astype(int).clip(0, 1)

    # Feature engineering
    df = add_time_features(df)

    return df


def train(csv_path: str, out_path: str, test_size: float = 0.25, random_state: int = 42) -> dict:
    df_raw = pd.read_csv(csv_path)
    df = clean_dataframe(df_raw)

    # Features & target
    cat_cols = ["age", "gender", "category", "period"]
    num_cols = ["amount", "hour"]
    X = df[cat_cols + num_cols]
    y = df["fraud"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )

    pre = build_preprocessor(cat_cols, num_cols)
    clf = GradientBoostingClassifier(random_state=random_state)

    if HAVE_IMB:
        # Oversample minority after preprocessing (feature space is numeric post-encoder)
        pipe = ImbPipeline(steps=[
            ("pre", pre),
            ("smote", SMOTE(random_state=random_state)),
            ("clf", clf),
        ])
    else:
        # Fallback pipeline without SMOTE
        pipe = SkPipeline(steps=[
            ("pre", pre),
            ("clf", clf),
        ])

    # Fit & evaluate
    pipe.fit(X_train, y_train)

    # Metrics
    try:
        proba = pipe.predict_proba(X_test)[:, 1]
        auc = float(roc_auc_score(y_test, proba))
    except Exception:
        proba = None
        auc = None

    y_pred = pipe.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    report = classification_report(y_test, y_pred, output_dict=True)

    # Save model (preprocessing + classifier)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    joblib.dump(pipe, out_path)

    # Save a compact training report
    training_report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "csv_path": os.path.abspath(csv_path),
        "model_path": os.path.abspath(out_path),
        "metrics": {
            "auc": auc,
            "accuracy": acc,
            "report": {
                "precision_fraud": round(report.get("1", {}).get("precision", 0.0), 4),
                "recall_fraud": round(report.get("1", {}).get("recall", 0.0), 4),
                "f1_fraud": round(report.get("1", {}).get("f1-score", 0.0), 4),
                "macro_f1": round(report.get("macro avg", {}).get("f1-score", 0.0), 4),
            },
        },
        "features": {
            "categorical": cat_cols,
            "numeric": num_cols,
            "expected_api_fields": ["step", "amount", "age", "gender", "category"],  # what your API should accept
        },
        "notes": {
            "imbalance": "SMOTE used" if HAVE_IMB else "SMOTE unavailable; no oversampling",
            "model": "GradientBoostingClassifier",
        },
    }

    with open("training_report.json", "w", encoding="utf-8") as f:
        json.dump(training_report, f, indent=2)

    return training_report


def main():
    parser = argparse.ArgumentParser(description="Train fraud detection model and save pipeline.")
    parser.add_argument("--csv", required=True, help="Path to training CSV (e.g., 'fraud - fraud.csv').")
    parser.add_argument("--out", default="fraud_model.joblib", help="Output joblib path.")
    parser.add_argument("--test_size", type=float, default=0.25)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    report = train(args.csv, args.out, test_size=args.test_size, random_state=args.seed)

    print("\n=== Training Summary ===")
    print(f"Saved model: {report['model_path']}")
    print(f"AUC: {report['metrics']['auc']}")
    print(f"Accuracy: {report['metrics']['accuracy']}")
    print(f"Recall (Fraud): {report['metrics']['report']['recall_fraud']}")
    print(f"Expected API fields: {report['features']['expected_api_fields']}")


if __name__ == "__main__":
    main()
