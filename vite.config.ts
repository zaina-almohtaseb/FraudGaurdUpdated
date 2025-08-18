import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"

const FLASK = process.env.VITE_API_BASE ?? "http://127.0.0.1:5000"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    proxy: {
      "/predict": { target: FLASK, changeOrigin: true },
      "/model":   { target: FLASK, changeOrigin: true },
      "/label":   { target: FLASK, changeOrigin: true },
      "/retrain": { target: FLASK, changeOrigin: true },
      "/transactions": { target: FLASK, changeOrigin: true },
      "/labels":  { target: FLASK, changeOrigin: true },
      "/dev":     { target: FLASK, changeOrigin: true }, // ← NEW
    },
  },
  preview: { port: 8080 },
})
