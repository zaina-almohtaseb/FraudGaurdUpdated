// src/pages/Index.tsx
import useState from "react";
import PredictionForm from "@/components/PredictionForm";
import ModelStatus from "@/components/ModelStatus";
import MetricsPanel from "@/components/MetricsPanel";

type Result = {
  fraud_prediction: number;
  fraud_probability: number;
  raw_id?: number;
};

export default function Index() {
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold">AI Fraud Detection Portal</h1>
        <p className="text-sm opacity-80 mt-2">
          Submit transaction details for real-time fraud analysis using advanced machine learning
        </p>
      </header>

      {/* Top: Form + Analysis Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold mb-3">Fraud Detection</h2>
          <p className="text-sm mb-4 opacity-75">Submit transaction details for AI analysis</p>
          <PredictionForm onResult={setResult} />
        </section>

        <section className="rounded-xl border bg-white p-5 flex items-center justify-center">
          {result ? (
            <div className="text-center">
              <div className="text-6xl mb-2">
                {result.fraud_prediction === 1 ? "🚨" : "✅"}
              </div>
              <div className="text-lg font-semibold mb-1">
                {result.fraud_prediction === 1 ? "Fraud Likely" : "Legitimate"}
              </div>
              <div className="opacity-80">
                Probability: {(result.fraud_probability * 100).toFixed(2)}%
              </div>
              {result.raw_id != null && (
                <div className="text-xs mt-2 opacity-60">raw_id: {result.raw_id}</div>
              )}
            </div>
          ) : (
            <div className="text-center opacity-70">
              <div className="text-5xl mb-2">🧠</div>
              <div className="font-semibold">Ready to analyze</div>
              <div className="text-sm">Submit transaction details to get fraud prediction</div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom: Model Status + Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <section className="rounded-xl border bg-white p-5">
          <ModelStatus />
        </section>
        <section className="rounded-xl border bg-white p-5">
          <MetricsPanel />
        </section>
      </div>
    </div>
  );
}
