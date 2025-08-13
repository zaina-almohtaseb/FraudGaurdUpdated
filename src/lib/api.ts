// src/lib/api.ts
import { API_BASE, ADMIN_TOKEN } from "./config";

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data as T;
}

// --- public endpoints ---
export const predict = (payload: any) =>
  req("/predict", { method: "POST", body: JSON.stringify(payload) });

// (we’ll add model/info & metrics later)

// --- admin (dev) ---
export const retrain = () =>
  req("/retrain", { method: "POST", headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {} });

export const saveLabel = (id: number, fraud: 0 | 1) =>
  req("/label", {
    method: "POST",
    headers: { ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}) },
    body: JSON.stringify({ id, fraud }),
  });
