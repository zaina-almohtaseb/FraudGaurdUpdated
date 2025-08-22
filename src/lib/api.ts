// src/lib/api.ts

// In dev, keep BASE empty so Vite proxy forwards to Flask.
// In prod, set VITE_API_BASE (e.g., https://api.yourdomain.com).
const BASE: string = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE ?? "")

/* ============================ Canonical types ============================ */
export type PredictIn = {
  step: number        // hours
  amount: number      // transaction amount
  age: string         // "0".."6" or "U"
  gender: string      // "M","F","U","E"
  category: string    // dataset category (e.g., es_food)
}

/* ---- Legacy input (keeps old components happy) ---- */
export type LegacyPredictIn = PredictIn & {
  oldbalanceOrg?: number
  newbalanceOrig?: number
  oldbalanceDest?: number
  newbalanceDest?: number
}



/* We accept BOTH shapes above and normalize before sending. */
type AnyPredictIn = PredictIn | LegacyPredictIn

export type PredictOut = {
  id: number
  prediction: number                 // probability of fraud
  probability_fraud: number          // same value as prediction
  model_version: number
  amount: number
  step: number
  age: string
  gender: string
  category: string
  hour: number
  period: string
  timestamp: string | null
}

export type ModelStatus = {
  last_trained: string | null
  features: string[]
  retrain_threshold: number
  new_labeled: number
  performance_metric: number
  training_samples: number
  model_version: number
  total_transactions: number
  labeled_transactions: number
  fraud_ratio: number
  class_0: number
  class_1: number
}

export type ModelMetrics = {
  total_transactions: number
  labeled_transactions: number
  fraud_ratio: number
  class_0: number
  class_1: number
}

export type RetrainOut = {
  ok: boolean
  metric?: number
  trained?: number
  model_version?: number
  message?: string
}

export type SaveLabelOut = { ok: boolean }

export type RecentTx = {
  id: number
  ts: string | null
  amount: number
  step: number
  hour: number
  period: string
  age: string
  gender: string
  category: string
  prediction: number | null
  is_fraud: 0 | 1 | null
  labeled_at: string | null
}
export type RecentTxResp = { count: number; items: RecentTx[] }

export type RecentLabel = {
  id: number
  raw_id: number
  is_fraud: 0 | 1
  labeled_at: string | null
  ts: string | null
  amount: number
  hour: number
  age: string
  gender: string
  category: string
  period: string
  last_prediction: number | null
}
export type RecentLabelsResp = { count: number; items: RecentLabel[] }

/* ============== Back-compat aliases so old imports compile ============== */
export type PredictionInput = PredictIn;      // legacy name
export type PredictionOutput = PredictOut;
export type ModelStatusResponse = ModelStatus; // some files used these
export type ModelMetricsResponse = ModelMetrics;

/* ============================ fixed dataset categories (exported for UI) ============================ */
export const CATEGORY_OPTIONS = [
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
] as const

/* ============================ fetch helper ============================ */
/** Universal fetch with cookies enabled so admin sessions work. */
async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    credentials: "include", // <<<<<< IMPORTANT: send cookies (admin session)
    headers: {
      Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  })

  const contentType = res.headers.get("content-type") || ""
  const raw = await res.text()
  let data: any = null
  if (raw) {
    try {
      data = contentType.includes("application/json") ? JSON.parse(raw) : raw
    } catch {
      data = raw
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `${res.status} ${res.statusText}` ||
      "Request failed"
    throw new Error(message)
  }

  // Handle empty 204 etc.
  return (data as T) ?? (null as T)
}

/* ============================ normalization ============================ */
function normalizePredictIn(p: AnyPredictIn): PredictIn {
  const { step, amount, age, gender, category } = p
  return {
    step: Number(step),
    amount: Number(amount),
    age: String(age).trim(),
    gender: String(gender).trim(),
    category: String(category).trim(),
  }
}

/* ============================ API calls ============================ */

// add after other API calls
export const logout = () =>
  req<{ ok: boolean }>("/auth/logout", { method: "POST" });

export const predict = (payload: AnyPredictIn) =>
  req<PredictOut>("/predict", {
    method: "POST",
    body: JSON.stringify(normalizePredictIn(payload)),
  })

export const getModelStatus = () =>
  req<ModelStatus>("/model/status")

export const getModelMetrics = () =>
  req<ModelMetrics>("/model/metrics")

export const retrain = () =>
  req<RetrainOut>("/retrain", { method: "POST" })

export const saveLabel = (id: number, is_fraud: 0 | 1) =>
  req<SaveLabelOut>("/label", {
    method: "POST",
    body: JSON.stringify({ id, is_fraud }),
  })

export const getRecentTransactions = (limit = 10) =>
  req<RecentTxResp>(`/transactions/recent?limit=${clamp(limit)}`)

export const getRecentLabels = (limit = 10) =>
  req<RecentLabelsResp>(`/labels/recent?limit=${clamp(limit)}`)

export const health = () =>
  req<{ status: string; model_present: boolean; db_ok: boolean }>("/health")

/* ============== Back-compat function aliases (if some files import these) ============== */
export const status = getModelStatus;
export const metrics = getModelMetrics;

/* ============================ utils ============================ */
function clamp(n: number) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v)) return 10
  return Math.min(100, Math.max(1, v))
}

/* Optional grouped export */
export const api = {
  predict,
  getModelStatus,
  getModelMetrics,
  retrain,
  saveLabel,
  getRecentTransactions,
  getRecentLabels,
  health,
  // back-compat
  status,
  metrics,
  CATEGORY_OPTIONS,
  logout
}
