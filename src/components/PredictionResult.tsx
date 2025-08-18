// src/components/PredictionResult.tsx
import React from "react";
import type { PredictionOutput } from "@/lib/api";

type Props = {
  result: PredictionOutput | null;
  title?: string;
};

const PredictionResult: React.FC<Props> = ({ result, title = "Prediction Result" }) => {
  if (!result) return null;

  const isFraud = result.prediction >= 0.5;

  return (
    <div className="mt-6 p-4 rounded-lg shadow border bg-card text-card-foreground">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>

      <div className="grid gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Transaction ID: </span>
          <span className="font-medium">{result.id}</span>
        </div>

        <div>
          <span className="text-muted-foreground">Amount: </span>
          <span className="font-medium">{result.amount.toFixed(2)}</span>
        </div>

        <div>
          <span className="text-muted-foreground">Prediction: </span>
          <span className={isFraud ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>
            {isFraud ? "Potential Fraud" : "Looks Safe"}
          </span>
          <span className="ml-2 text-muted-foreground">
            ({(result.prediction * 100).toFixed(1)}%)
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          {new Date(result.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;
