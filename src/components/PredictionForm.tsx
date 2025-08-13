// src/components/PredictionForm.tsx
import * as React from "react";

export type PredictionFormProps = {
  onSuccess?: (payload: any) => void;
};

function PredictionForm({ onSuccess }: PredictionFormProps) {
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // minimal stub submit
    onSuccess?.({ ok: true });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-md">
      <label className="text-sm font-medium">Amount</label>
      <input
        name="amount"
        type="number"
        defaultValue={15}
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        className="rounded px-4 py-2 bg-rose-600 text-white font-semibold"
      >
        Analyze
      </button>
    </form>
  );
}

export default PredictionForm;
export { PredictionForm }; // also export as named for safety
