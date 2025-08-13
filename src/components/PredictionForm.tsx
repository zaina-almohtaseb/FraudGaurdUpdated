// src/components/PredictionForm.tsx
import useState from "react";
import API_BASE from "@/lib/config";

type Result = {
  fraud_prediction: number;
  fraud_probability: number;
  raw_id?: number;
};

type Props = {
  onResult: (r: Result) => void;
};

const CATEGORIES = [
  "es_transport",
  "es_food",
  "es_health",
  "es_fashion",
  "es_home",
  "es_entertainment",
  "es_others",
];

export default function PredictionForm({ onResult }: Props) {
  const [step, setStep] = useState<number | "">("");
  const [amount, setAmount] = useState<number | "">("");
  const [age, setAge] = useState<string>("U");
  const [gender, setGender] = useState<"U" | "M" | "F">("U");
  const [category, setCategory] = useState<string>("es_transport");
  const [merchant, setMerchant] = useState<string>("");
  const [zipcodeOri, setZipcodeOri] = useState<string>("");
  const [zipMerchant, setZipMerchant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // minimal validation
    if (step === "" || step < 0) return setError("Step must be ≥ 0");
    if (amount === "" || amount < 0) return setError("Amount must be ≥ 0");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: Number(step),
          amount: Number(amount),
          age,
          gender,
          category,
          merchant: merchant || undefined,
          zipcodeOri: zipcodeOri || undefined,
          zipMerchant: zipMerchant || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      onResult({
        fraud_prediction: data.fraud_prediction,
        fraud_probability: data.fraud_probability,
        raw_id: data.raw_id,
      });
    } catch (err: any) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  function fillTest() {
    setStep(6);
    setAmount(30);
    setAge("3");
    setGender("M");
    setCategory("es_transport");
    setMerchant("M12345");
    setZipcodeOri("28007");
    setZipMerchant("28007");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Step *</span>
          <input
            type="number"
            min={0}
            value={step}
            onChange={(e) => setStep(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-md border p-2"
            placeholder="e.g., 6"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Amount *</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-md border p-2"
            placeholder="e.g., 30"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Age *</span>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="rounded-md border p-2"
          >
            <option value="U">U (Unknown)</option>
            {Array.from({ length: 9 }).map((_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Gender *</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "U" | "M" | "F")}
            className="rounded-md border p-2"
          >
            <option value="U">U (Unknown)</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-semibold">Category *</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border p-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Merchant (optional)</span>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="rounded-md border p-2"
            placeholder="e.g., M12345"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Origin Zipcode (optional)</span>
          <input
            value={zipcodeOri}
            onChange={(e) => setZipcodeOri(e.target.value)}
            className="rounded-md border p-2"
            placeholder="e.g., 28007"
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm">Merchant Zipcode (optional)</span>
          <input
            value={zipMerchant}
            onChange={(e) => setZipMerchant(e.target.value)}
            className="rounded-md border p-2"
            placeholder="e.g., 28007"
          />
        </label>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-rose-700 text-white disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze Transaction"}
        </button>
        <button
          type="button"
          onClick={fillTest}
          className="px-4 py-2 rounded-md border"
        >
          Fill Test Values
        </button>
      </div>
    </form>
  );
}
