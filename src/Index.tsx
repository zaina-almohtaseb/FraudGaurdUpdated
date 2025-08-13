// src/pages/Index.tsx
import React from "react";
import PredictionForm from "@/components/PredictionForm"; // <-- default import
import ModelStatus from "@/components/ModelStatus";       // optional widget
import MetricsPanel from "@/components/MetricsPanel";     // optional widget

export default function Index() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white/70 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Fraud Detection</h2>
          <PredictionForm />
        </div>

        <div className="rounded-xl border bg-white/70 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Analysis Results</h2>
          {/* You can also surface last prediction output here if your form writes to state/context */}
          <p className="text-sm text-muted-foreground">Ready to analyze</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white/70 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Model Status</h3>
          <ModelStatus />
        </div>

        <div className="rounded-xl border bg-white/70 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Performance Metrics</h3>
          <MetricsPanel />
        </div>
      </section>
    </main>
  );
}
