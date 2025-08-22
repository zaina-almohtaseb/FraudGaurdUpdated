// src/pages/Index.tsx
import { useMemo, useState } from "react";
import ModelStatus from "@/components/ModelStatus";
import MetricsPanel from "@/components/MetricsPanel";
import { predict } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FraudButton } from "@/components/ui/fraud-button";
import { useToast } from "@/hooks/use-toast";

/** Dataset categories (read-only list you trained on) */
const CATEGORY_OPTIONS = [
  "es_barsandrestaurants",
  "es_contents",
  "es_fashion",
  "es_food",
  "es_health",
  "es_home",
  "es_hotelservices",
  "es_hyper",
  "es_leisure",
  "es_otherservices",
  "es_sportsandtoys",
  "es_tech",
  "es_transportation",
  "es_travel",
  "es_wellnessandbeauty",
] as const;

const AGE_OPTIONS = [
  { value: "0", label: "0 (≤18)" },
  { value: "1", label: "1 (19–25)" },
  { value: "2", label: "2 (26–35)" },
  { value: "3", label: "3 (36–45)" },
  { value: "4", label: "4 (46–55)" },
  { value: "5", label: "5 (56–65)" },
  { value: "6", label: "6 (>65)" },
  { value: "U", label: "U (Unknown)" },
];

const GENDER_OPTIONS = [
  { value: "M", label: "M" },
  { value: "F", label: "F" },
  { value: "U", label: "U" },
  { value: "E", label: "E (Enterprise)" },
];

type Result = {
  cls: 0 | 1;
  prob: number;   // 0..1
  raw_id?: number;
};

function humanizeCategory(s: string) {
  return s.replace(/^\w\w_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Form = {
  timeOfDay: string; // HH:MM
  amount: string;
  age: string;
  gender: string;
  category: string;
  // UI-only (not sent)
  transactionId: string;
  merchant: string;
  zipcodeOri: string;
  zipMerchant: string;
};

export default function Index() {
  const { toast } = useToast();
  const [result, setResult] = useState<Result | null>(null);

  // Local form state (transactions block is UI-only)
  const [form, setForm] = useState<Form>({
    timeOfDay: "",
    amount: "",
    age: "U",
    gender: "U",
    category: "",
    transactionId: "",
    merchant: "",
    zipcodeOri: "",
    zipMerchant: "",
  });

  const setField = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const valid = useMemo(() => {
    const hasTime = !!form.timeOfDay;
    const amt = Number(form.amount);
    const catOk = CATEGORY_OPTIONS.includes(form.category as any);
    return hasTime && Number.isFinite(amt) && amt >= 0 && !!form.age && !!form.gender && catOk;
  }, [form]);

  // Normalize backend response → (probability, class)
  function normalizeResponse(d: any): Result {
    // probability candidates
    const probRaw =
      d?.probability_fraud ??
      d?.prediction ??
      d?.proba ??
      d?.score ??
      d?.prob ??
      d?.p;

    let prob = Number(probRaw);
    if (!Number.isFinite(prob)) prob = 0;

    // class candidates
    let clsRaw =
      d?.is_fraud ??
      d?.fraud_prediction ??
      d?.label ??
      d?.class ??
      d?.y_pred;

    let cls: 0 | 1;
    if (clsRaw === 0 || clsRaw === 1 || clsRaw === "0" || clsRaw === "1") {
      cls = Number(clsRaw) as 0 | 1;
    } else {
      // derive from probability (default threshold 0.5)
      cls = prob >= 0.5 ? 1 : 0;
    }

    return {
      cls,
      prob: Math.max(0, Math.min(1, prob)),
      raw_id: d?.raw_id ?? d?.id,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      toast({
        title: "Invalid input",
        description: "Enter time, non-negative amount, and select age/gender/category.",
        variant: "destructive",
      });
      return;
    }
    // HH:MM → hour (0–23)
    const [hStr] = (form.timeOfDay || "0:00").split(":");
    const hour = Math.max(0, Math.min(23, Number(hStr) || 0));

    try {
      // IMPORTANT: only send model features (transactions block is UI-only)
      const res = await predict({
        step: hour, // backend expects 'step'; we map time-of-day → step
        amount: Number(form.amount),
        age: form.age,
        gender: form.gender,
        category: form.category as (typeof CATEGORY_OPTIONS)[number],
      } as any);

      const norm = normalizeResponse(res);
      setResult(norm);
      toast({ title: "Analysis complete" });
    } catch (err: any) {
      toast({
        title: "Prediction failed",
        description: err?.message ?? "Backend error",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold">AI Fraud Detection Portal</h1>
        <p className="text-sm opacity-80 mt-2">
          Submit transaction details for real-time fraud analysis using your trained model
        </p>
      </header>

      {/* Top: Form + Analysis Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold mb-3">Fraud Detection</h2>
          <p className="text-sm mb-4 opacity-75">Core features + transaction details</p>

          <form className="grid gap-6" onSubmit={onSubmit}>
            {/* Core Features */}
            <fieldset className="border rounded-xl p-4">
              <legend className="px-2 text-sm font-semibold text-muted-foreground">Core Features</legend>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Time of Day */}
                <div>
                  <Label htmlFor="timeOfDay">Time of Day</Label>
                  <Input
                    id="timeOfDay"
                    type="time"
                    value={form.timeOfDay}
                    onChange={(e) => setField("timeOfDay")(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Converted to <strong>hour</strong> (0–23) for the model.
                  </p>
                </div>

                {/* Amount with static $ */}
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <div className="flex">
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center justify-center h-10 px-3 rounded-l-md border border-input border-r-0 bg-muted text-muted-foreground"
                    >
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      className="
                        rounded-l-none
                        [appearance:textfield]
                        [&::-webkit-outer-spin-button]:appearance-none
                        [&::-webkit-inner-spin-button]:appearance-none
                      "
                      value={form.amount}
                      onChange={(e) => setField("amount")(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                {/* Age */}
                <div>
                  <Label>Age</Label>
                  <Select value={form.age} onValueChange={setField("age")}>
                    <SelectTrigger><SelectValue placeholder="Age bucket" /></SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={setField("gender")}>
                    <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category (humanized) */}
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={setField("category")}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{humanizeCategory(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            {/* Transaction Details (optional / UI-only) */}
            <fieldset className="border rounded-xl p-4">
              <legend className="px-2 text-sm font-semibold text-muted-foreground">Transaction Details</legend>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="transactionId">Transaction ID (optional)</Label>
                  <Input
                    id="transactionId"
                    value={form.transactionId}
                    onChange={(e) => setField("transactionId")(e.target.value)}
                    placeholder="e.g., TXN-123456"
                  />
                </div>

                <div>
                  <Label htmlFor="merchant">Merchant (optional)</Label>
                  <Input
                    id="merchant"
                    value={form.merchant}
                    onChange={(e) => setField("merchant")(e.target.value)}
                    placeholder="e.g., M1826465P"
                  />
                </div>

                <div>
                  <Label htmlFor="zipcodeOri">Origin Zip (optional)</Label>
                  <Input
                    id="zipcodeOri"
                    value={form.zipcodeOri}
                    onChange={(e) => setField("zipcodeOri")(e.target.value)}
                    placeholder="e.g., 28007"
                  />
                </div>

                <div>
                  <Label htmlFor="zipMerchant">Merchant Zip (optional)</Label>
                  <Input
                    id="zipMerchant"
                    value={form.zipMerchant}
                    onChange={(e) => setField("zipMerchant")(e.target.value)}
                    placeholder="e.g., 28007"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Note:</strong> These fields are for display only and are <em>not</em> sent to the model.
              </p>
            </fieldset>

            <FraudButton type="submit" className="mt-1 w-full md:w-52" variant="gradient" size="lg" disabled={!valid}>
              Analyze
            </FraudButton>
          </form>
        </section>

        {/* Analysis Result */}
        <section className="rounded-xl border bg-white p-5 flex items-center justify-center">
          {result ? (
            <div className="text-center">
              <div className="text-6xl mb-2">{result.cls === 1 ? "🚨" : "✅"}</div>
              <div className="text-lg font-semibold mb-1">
                {result.cls === 1 ? "Fraud Likely" : "Legitimate"}
              </div>
              <div className="opacity-80">
                Probability: {(result.prob * 100).toFixed(2)}%
              </div>
              {result.raw_id != null && (
                <div className="text-xs mt-2 opacity-60">raw_id: {result.raw_id}</div>
              )}
            </div>
          ) : (
            <div className="text-center opacity-70">
              <div className="text-5xl mb-2">🧠</div>
              <div className="font-semibold">Ready to analyze</div>
              <div className="text-sm">Enter time, amount, age, gender, and category</div>
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
