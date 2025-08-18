# app.py  (Flask on port 5000)
from __future__ import annotations
from flask import Flask, request, jsonify
from datetime import datetime
import os
import joblib
import pandas as pd
import random

from sqlalchemy import (
    create_engine, Column, Integer, Float, String, DateTime, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score
from sklearn.ensemble import GradientBoostingClassifier

# ---------------------------------------------------------------------------
# ENV-CONFIGURABLE DATABASE
# ---------------------------------------------------------------------------
def _env_bool(name: str, default: bool = False) -> bool:
  v = os.getenv(name)
  if v is None:
      return default
  return v.lower() in ("1", "true", "yes", "on")

def _normalize_db_url(url: str) -> str:
  # Heroku-style URL compatibility
  if url.startswith("postgres://"):
      return url.replace("postgres://", "postgresql+psycopg2://", 1)
  return url

def _make_engine():
  raw_url = (
      os.getenv("DB_URL")
      or os.getenv("DATABASE_URL")
      or "sqlite:///fraud.db"
  )
  url = _normalize_db_url(raw_url)

  pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
  max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
  pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "1800"))
  echo = _env_bool("DB_ECHO", False)

  if url.startswith("sqlite:"):
      # ensure folder exists for file-based sqlite
      try:
          db_path = url.split("///", 1)[1]
          if db_path and "/" in db_path:
              os.makedirs(os.path.dirname(db_path), exist_ok=True)
      except Exception:
          pass

      eng = create_engine(
          url,
          echo=echo,
          future=True,
          connect_args={"check_same_thread": False},
          pool_pre_ping=True,
      )
  else:
      eng = create_engine(
          url,
          echo=echo,
          future=True,
          pool_pre_ping=True,
          pool_size=pool_size,
          max_overflow=max_overflow,
          pool_recycle=pool_recycle,
      )

  return eng, url

engine, EFFECTIVE_DB_URL = _make_engine()
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

# ---------------------------------------------------------------------------
# CONSTANTS FOR SYNTHETIC DATA / CHOICES
# ---------------------------------------------------------------------------
AGE_OPTS = ["0", "1", "2", "3", "4", "5", "6", "U"]
GENDER_OPTS = ["M", "F", "U", "E"]
CATEGORY_OPTS = [
  "es_barsandrestaurants",
  "es_contents",
  "es_fashion",
  "es_food",
  "es_health",
  "es_home",
  "es_hotelservices",
  "es_hyper",
  "es_leisure",
  "es_otherservices",
  "es_sportsandtoys",
  "es_tech",
  "es_transportation",
  "es_travel",
  "es_wellnessandbeauty",
]

# ---------------------------------------------------------------------------
# ORM MODELS (+ INDEXES)
# ---------------------------------------------------------------------------
class Transaction(Base):
  __tablename__ = "transactions"

  id = Column(Integer, primary_key=True)
  ts = Column(DateTime, default=datetime.utcnow, index=True)
  amount = Column(Float, nullable=False)
  step = Column(Integer, nullable=False)
  age = Column(String, nullable=False)
  gender = Column(String, nullable=False)
  category = Column(String, nullable=False)
  hour = Column(Integer, nullable=False)
  period = Column(String, nullable=False)
  prediction = Column(Float, nullable=True)  # probability of fraud
  is_fraud = Column(Integer, nullable=True)  # 0/1 when labeled
  labeled_at = Column(DateTime, nullable=True)

  __table_args__ = (
      Index("ix_transactions_is_fraud", "is_fraud"),
      Index("ix_transactions_labeled_at", "labeled_at"),
      Index("ix_transactions_ts", "ts"),
      Index("ix_transactions_category", "category"),
  )

class ModelMeta(Base):
  __tablename__ = "model_meta"

  id = Column(Integer, primary_key=True)
  last_trained = Column(DateTime, nullable=True)
  retrain_threshold = Column(Integer, default=10)
  training_samples = Column(Integer, default=0)
  performance_metric = Column(Float, default=0.0)
  labeled_at_train = Column(Integer, default=0)  # labeled count at last train
  model_version = Column(Integer, default=0)

Base.metadata.create_all(engine)

# backfill columns/indexes for existing sqlite dbs
with engine.begin() as conn:
  dialect = engine.dialect.name
  if dialect == "sqlite":
      cols = {r[1] for r in conn.exec_driver_sql("PRAGMA table_info(model_meta)").fetchall()}
      if "labeled_at_train" not in cols:
          conn.exec_driver_sql("ALTER TABLE model_meta ADD COLUMN labeled_at_train INTEGER DEFAULT 0")
      if "model_version" not in cols:
          conn.exec_driver_sql("ALTER TABLE model_meta ADD COLUMN model_version INTEGER DEFAULT 0")
  else:
      for colsql in (
          "ALTER TABLE model_meta ADD COLUMN labeled_at_train INTEGER DEFAULT 0",
          "ALTER TABLE model_meta ADD COLUMN model_version INTEGER DEFAULT 0",
      ):
          try:
              conn.exec_driver_sql(colsql)
          except Exception:
              pass
  for sql in (
      "CREATE INDEX IF NOT EXISTS ix_transactions_is_fraud ON transactions (is_fraud)",
      "CREATE INDEX IF NOT EXISTS ix_transactions_labeled_at ON transactions (labeled_at)",
      "CREATE INDEX IF NOT EXISTS ix_transactions_ts ON transactions (ts)",
      "CREATE INDEX IF NOT EXISTS ix_transactions_category ON transactions (category)",
  ):
      try:
          conn.exec_driver_sql(sql)
      except Exception:
          pass

with SessionLocal() as s:
  meta = s.query(ModelMeta).first()
  if not meta:
      s.add(ModelMeta(retrain_threshold=int(os.getenv("RETRAIN_THRESHOLD", "10"))))
      s.commit()

# ---------------------------------------------------------------------------
# ML PIPELINE
# ---------------------------------------------------------------------------
MODEL_PATH = "model.joblib"

def _period_from_hour(h: int) -> str:
  if 5 <= h < 12: return "Morning"
  if 12 <= h < 17: return "Afternoon"
  if 17 <= h < 21: return "Evening"
  return "Night"

def _make_pipeline() -> Pipeline:
  cat_cols = ["age", "gender", "category", "period"]
  num_cols = ["amount", "hour"]
  pre = ColumnTransformer(
      transformers=[
          ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
          ("num", StandardScaler(), num_cols),
      ]
  )
  clf = GradientBoostingClassifier(random_state=42)
  return Pipeline(steps=[("pre", pre), ("clf", clf)])

def _load_or_init_model() -> Pipeline:
  if os.path.exists(MODEL_PATH):
      try:
          return joblib.load(MODEL_PATH)
      except Exception:
          pass
  return _make_pipeline()

model: Pipeline = _load_or_init_model()

def _df_from_rows(rows: list[Transaction]) -> pd.DataFrame:
  data = [{
      "amount": r.amount,
      "step": r.step,
      "age": r.age or "U",
      "gender": r.gender or "U",
      "category": r.category,
      "hour": r.hour,
      "period": r.period,
      "is_fraud": r.is_fraud if r.is_fraud is not None else None,
  } for r in rows]
  return pd.DataFrame(data)

def _current_labeled_count(session) -> int:
  return int(session.query(Transaction).filter(Transaction.is_fraud.isnot(None)).count())

def retrain_now() -> dict:
  """Retrain using all labeled rows; update meta + save model; bump version."""
  with SessionLocal() as s:
      rows = s.query(Transaction).filter(Transaction.is_fraud.isnot(None)).all()
      df = _df_from_rows(rows)
      if df.empty or df["is_fraud"].nunique() < 2:
          return {"ok": False, "message": "Need labeled positives and negatives to train."}

      X = df[["amount", "hour", "age", "gender", "category", "period"]]
      y = df["is_fraud"].astype(int)

      Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)
      pipe = _make_pipeline()
      pipe.fit(Xtr, ytr)

      try:
          p = pipe.predict_proba(Xte)[:, 1]
          metric = float(roc_auc_score(yte, p))
      except Exception:
          metric = 0.0

      joblib.dump(pipe, MODEL_PATH)
      global model
      model = pipe

      meta = s.query(ModelMeta).first()
      meta.last_trained = datetime.utcnow()
      meta.performance_metric = metric
      meta.training_samples = int(df.shape[0])
      meta.labeled_at_train = _current_labeled_count(s)
      meta.model_version = int((meta.model_version or 0) + 1)
      s.commit()

      return {
          "ok": True,
          "metric": metric,
          "trained": int(df.shape[0]),
          "model_version": meta.model_version,
      }

# ---------------------------------------------------------------------------
# FLASK APP + ROUTES
# ---------------------------------------------------------------------------
app = Flask(__name__)

# ---- Utility serializers ----
def _tx_json(t: Transaction) -> dict:
  return {
      "id": t.id,
      "amount": t.amount,
      "step": t.step,
      "age": t.age,
      "gender": t.gender,
      "category": t.category,
      "prediction": t.prediction,
      "probability_fraud": t.prediction,
      "timestamp": t.ts.isoformat() if t.ts else None,
      "ts": t.ts.isoformat() if t.ts else None,
  }

def _label_json(t: Transaction) -> dict:
  return {
      "id": t.id,
      "is_fraud": t.is_fraud,
      "labeled_at": t.labeled_at.isoformat() if t.labeled_at else None,
  }

@app.route("/model/status", methods=["GET"])
def model_status():
  with SessionLocal() as s:
      meta = s.query(ModelMeta).first()
      totals = s.query(Transaction).count()
      labeled = _current_labeled_count(s)
      class0 = s.query(Transaction).filter(Transaction.is_fraud == 0).count()
      class1 = s.query(Transaction).filter(Transaction.is_fraud == 1).count()
      new_labeled_since_train = max(0, labeled - (meta.labeled_at_train or 0))

      return jsonify({
          "last_trained": meta.last_trained.isoformat() if meta.last_trained else None,
          "features": ["amount","hour","age","gender","category","period"],
          "retrain_threshold": meta.retrain_threshold,
          "new_labeled": new_labeled_since_train,
          "performance_metric": meta.performance_metric,
          "training_samples": meta.training_samples,
          "model_version": meta.model_version or 0,
          "total_transactions": totals,
          "labeled_transactions": labeled,
          "fraud_ratio": (class1 / labeled) if labeled else 0.0,
          "class_0": class0,
          "class_1": class1,
          "db_url": EFFECTIVE_DB_URL,
      })

@app.route("/model/metrics", methods=["GET"])
def model_metrics():
  with SessionLocal() as s:
      totals = s.query(Transaction).count()
      labeled = _current_labeled_count(s)
      class0 = s.query(Transaction).filter(Transaction.is_fraud == 0).count()
      class1 = s.query(Transaction).filter(Transaction.is_fraud == 1).count()
      return jsonify({
          "total_transactions": totals,
          "labeled_transactions": labeled,
          "fraud_ratio": (class1 / labeled) if labeled else 0.0,
          "class_0": class0,
          "class_1": class1,
      })

@app.route("/predict", methods=["POST"])
def predict():
  data = request.get_json(force=True) or {}
  try:
      amount = float(data["amount"])
      step = int(data["step"])
      age = str(data.get("age", "U") or "U")
      gender = str(data.get("gender", "U") or "U")
      category = str(data["category"])
  except Exception:
      return jsonify({"message":"Invalid payload; needs amount, step, age, gender, category."}), 400

  if amount < 0 or step < 0:
      return jsonify({"message":"amount and step must be ≥ 0"}), 400

  hour = step % 24
  period = _period_from_hour(hour)

  df = pd.DataFrame([{
      "amount": amount, "step": step, "age": age, "gender": gender,
      "category": category, "hour": hour, "period": period
  }])

  try:
      proba = float(model.predict_proba(df)[0,1])
  except Exception:
      proba = 0.0

  with SessionLocal() as s:
      row = Transaction(
          amount=amount, step=step, age=age, gender=gender, category=category,
          hour=hour, period=period, prediction=proba
      )
      s.add(row)
      s.commit()

      return jsonify({
          "id": row.id,
          "prediction": proba,
          "probability_fraud": proba,
          "amount": amount, "step": step,
          "age": age, "gender": gender, "category": category,
          "hour": hour, "period": period,
          "timestamp": row.ts.isoformat() if row.ts else None,
          "model_version": s.query(ModelMeta).first().model_version or 0,
      })

@app.route("/label", methods=["POST"])
def label():
  data = request.get_json(force=True) or {}
  try:
      row_id = int(data["id"])
      is_fraud = int(data["is_fraud"])
      assert is_fraud in (0,1)
  except Exception:
      return jsonify({"message":"Need id and is_fraud (0/1)."}), 400

  with SessionLocal() as s:
      row = s.get(Transaction, row_id)
      if not row:
          return jsonify({"message":"Row not found"}), 404

      row.is_fraud = is_fraud
      row.labeled_at = datetime.utcnow()
      s.commit()

      # labeled-based threshold check
      meta = s.query(ModelMeta).first()
      labeled_now = _current_labeled_count(s)
      new_labeled_since_train = labeled_now - (meta.labeled_at_train or 0)

      if new_labeled_since_train >= (meta.retrain_threshold or 10):
          retrain_out = retrain_now()
          code = 200 if retrain_out.get("ok") else 400
          return jsonify({"ok": True, "retrained": retrain_out}), code

      return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# NEW: Recent lists for UI (/recent page)
# ---------------------------------------------------------------------------
@app.route("/transactions/recent", methods=["GET"])
def recent_transactions():
  """Return last N predictions (most recent first)."""
  try:
      limit = max(1, int(request.args.get("limit", 10)))
  except Exception:
      limit = 10
  with SessionLocal() as s:
      rows = (
          s.query(Transaction)
           .order_by(Transaction.ts.desc())
           .limit(limit)
           .all()
      )
      return jsonify([_tx_json(r) for r in rows])

@app.route("/labels/recent", methods=["GET"])
def recent_labels():
  """Return last N labeled rows (most recent labeled first)."""
  try:
      limit = max(1, int(request.args.get("limit", 10)))
  except Exception:
      limit = 10
  with SessionLocal() as s:
      rows = (
          s.query(Transaction)
           .filter(Transaction.is_fraud.isnot(None))
           .order_by(Transaction.labeled_at.desc())
           .limit(limit)
           .all()
      )
      return jsonify([_label_json(r) for r in rows])

# ---------------------------------------------------------------------------
# DEV SEED ENDPOINT: create N labeled rows and (optionally) retrain
# ---------------------------------------------------------------------------
def _random_tx():
  amount = max(0.5, random.gauss(120.0, 60.0))
  step = max(0, int(abs(random.gauss(72, 48))))
  age = random.choice(AGE_OPTS)
  gender = random.choice(GENDER_OPTS)
  category = random.choice(CATEGORY_OPTS)
  hour = step % 24
  period = _period_from_hour(hour)
  return dict(amount=amount, step=step, age=age, gender=gender, category=category, hour=hour, period=period)

@app.route("/dev/quick-seed", methods=["POST"])
def dev_quick_seed():
  data = request.get_json(silent=True) or {}
  n = int(data.get("n", 10))
  fraud_ratio = float(data.get("fraud_ratio", 0.3))
  fraud_ratio = min(max(fraud_ratio, 0.0), 1.0)
  force_retrain = bool(data.get("force_retrain", False))

  if n <= 0:
      return jsonify({"ok": False, "message": "n must be > 0"}), 400

  created_ids = []
  with SessionLocal() as s:
      # create transactions with predictions
      for _ in range(n):
          tx = _random_tx()
          df = pd.DataFrame([{
              "amount": tx["amount"], "step": tx["step"], "age": tx["age"], "gender": tx["gender"],
              "category": tx["category"], "hour": tx["hour"], "period": tx["period"]
          }])
          try:
              proba = float(model.predict_proba(df)[0,1])
          except Exception:
              proba = 0.0

          row = Transaction(**tx, prediction=proba)
          s.add(row)
          s.flush()
          created_ids.append(row.id)
      s.commit()

      # label them (both classes present)
      n_fraud = int(round(fraud_ratio * n))
      ids = created_ids[:]
      random.shuffle(ids)
      fraud_ids = set(ids[:n_fraud])
      now = datetime.utcnow()

      for rid in created_ids:
          row = s.get(Transaction, rid)
          row.is_fraud = 1 if rid in fraud_ids else 0
          row.labeled_at = now
      s.commit()

      meta = s.query(ModelMeta).first()
      labeled_now = _current_labeled_count(s)
      new_labeled_since_train = labeled_now - (meta.labeled_at_train or 0)

  retrained = None
  if force_retrain or new_labeled_since_train >= (meta.retrain_threshold or 10):
      retrained = retrain_now()

  return jsonify({
      "ok": True,
      "created": len(created_ids),
      "fraud_labeled": n_fraud,
      "nonfraud_labeled": n - n_fraud,
      "new_labeled_since_train": int(new_labeled_since_train),
      "threshold": meta.retrain_threshold,
      "forced": force_retrain,
      "retrained": retrained,
  })

@app.route("/retrain", methods=["POST"])
def retrain():
  out = retrain_now()
  code = 200 if out.get("ok") else 400
  return jsonify(out), code

@app.route("/", methods=["GET"])
def index():
  with SessionLocal() as s:
      meta = s.query(ModelMeta).first()
  return jsonify({
      "cwd": os.getcwd(),
      "app_file": __file__,
      "routes": sorted(str(r) for r in app.url_map.iter_rules()),
      "threshold": meta.retrain_threshold,
      "model_version": meta.model_version or 0,
      "db_url": EFFECTIVE_DB_URL,
  })

if __name__ == "__main__":
  print(">>> FRAUDGUARD BACKEND on :5000 (recent endpoints + /dev/quick-seed available)")
  app.run(host="127.0.0.1", port=5000, debug=True)
