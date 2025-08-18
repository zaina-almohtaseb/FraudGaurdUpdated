// lib/config.ts
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000";

// DEV ONLY: don't ship this to prod. We'll move to a secure proxy later.
export const ADMIN_TOKEN =
  (import.meta as any).env?.VITE_ADMIN_TOKEN || "";
