// src/integrations/api.ts
import { API_BASE, ADMIN_TOKEN } from "@/lib/config";

export type PredictPayload = {
  step: number;
  amount: number;
  age: string;        // 'U' or '0'..'8'
  gender: 'U' | 'M' | 'F';
  category: string;   // e.g. 'es_food'
  merchant?: string;
  zipcodeOri?: string;
  zipMerchant?: string;
};

async function parse(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function apiPredict(payload: PredictPayload) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(JSON.stringify(await parse(res)));
  return parse(res);
}

export async function apiModelInfo() {
  const res = await fetch(`${API_BASE}/model/info`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiMetrics() {
  const res = await fetch(`${API_BASE}/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// -------- DEV-ONLY admin helpers (use token) --------
export async function apiAdminRetrain() {
  const res = await fetch(`${API_BASE}/retrain`, {
    method: "POST",
    headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => ({}));
}

export async function apiAdminLabel(id: number, fraud: 0 | 1) {
  const res = await fetch(`${API_BASE}/label`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
    },
    body: JSON.stringify({ id, fraud }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => ({}));
}
