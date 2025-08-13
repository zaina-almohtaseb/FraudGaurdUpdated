import { useState } from "react";
import { predict } from "@/lib/api";

type PredictResponse = {
  fraud_prediction: 0 | 1;
  fraud_probability: number;
  raw_id?: number;
  retrain?: { should_retrain: boolean; new_records: number; threshold: number };
};

export default function PredictionForm() {
  const [step, setStep] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [age, setAge] = useState<string>("U");
  const [gender, setGender] = useState<"U" | "M" | "F">("U");
  const [category, setCategory] = useState<string>("es_transport");
  const [merchant, setMerchant] = useState<string>("");
  const [zipcodeOri, setZipcodeOri] = useState<string>("");
  const [zipMerchant, setZipMerchant] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  function fillTest() {
    setStep(123);
    setAmount(85.5);
    setAge("U");
    setGender("M");
    setCategory("es_transport");
    setMerchant("M12345");
    setZipcodeOri("28007");
    setZipMerchant("28007");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const data = await predict({
        step,
        amount,
        age,
        gender,
        category,
        merchant: merchant || undefined,
        zipcodeOri: zipcodeOri || undefined,
        zipMerchant: zipMerchant || undefined,
      });
      setResult(data);
    } catch (e: any) {
      setErr(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span>Step (int ≥ 0)</span>
          <input
            type="number"
            min={0}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="border rounded px-3 py-2"
            required
          />
        </label>

        <label className="flex flex-col">
          <span>Amount (≥ 0)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="border rounded px-3 py-2"
            required
          />
        </label>

        <label className="flex flex-col">
          <span>Age band</span>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="U">U (Unknown)</option>
            {[0,1,2,3,4,5,6,7,8].map(v => (
              <option key={v} value={String(v)}>{v}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span>Gender</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="U">U (Unknown)</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </label>

        <label className="flex flex-col md:col-span-2">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="es_transport">es_transport</option>
            <option value="es_food">es_food</option>
            <option value="es_health">es_health</option>
            <option value="es_fashion">es_fashion</option>
            <option value="es_home">es_home</option>
            <option value="es_entertainment">es_entertainment</option>
            <option value="es_others">es_others</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span>Merchant (optional)</span>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g., M12345"
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col">
          <span>Customer ZIP (optional)</span>
          <input
            value={zipcodeOri}
            onChange={(e) => setZipcodeOri(e.target.value)}
            placeholder="e.g., 28007"
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col md:col-span-2">
          <span>Merchant ZIP (optional)</span>
          <input
            value={zipMerchant}
            onChange={(e) => setZipMerchant(e.target.value)}
            placeholder="e.g., 28007"
            className="border rounded px-3 py-2"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-rose-700 text-white disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Analyze Transaction"}
        </button>
        <button
          type="button"
          onClick={fillTest}
          className="px-4 py-2 rounded bg-rose-300 text-white"
        >
          Fill Test Values
        </button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}
      {result && (
        <div className="text-sm mt-2 space-y-1">
          <div><b>Fraud Prediction:</b> {result.fraud_prediction}</div>
          <div><b>Fraud Probability:</b> {(result.fraud_probability * 100).toFixed(2)}%</div>
          <div className="opacity-70">
            raw_id: {result.raw_id ?? "n/a"} |
            retrain: {result.retrain?.should_retrain ? "yes" : "no"} |
            new: {result.retrain?.new_records ?? 0} / {result.retrain?.threshold ?? "-"}
          </div>
        </div>
      )}
    </form>
  );
}
export { PredictionForm };
