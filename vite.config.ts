// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
    proxy: {
      "/predict": "http://127.0.0.1:5000",
      "/transactions": "http://127.0.0.1:5000",
      "/label": "http://127.0.0.1:5000",
      "/model": "http://127.0.0.1:5000",
      "/metrics": "http://127.0.0.1:5000",
      "/admin": "http://127.0.0.1:5000"
    }
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
