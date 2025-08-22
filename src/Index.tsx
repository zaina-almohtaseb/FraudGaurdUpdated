// src/components/PredictionForm.tsx
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FraudButton } from "@/components/ui/fraud-button";
import { useToast } from "@/hooks/use-toast";
import { predict, type PredictOut, CATEGORY_OPTIONS } from "@/lib/api";

type Props = {
  /** Called with the successful prediction response */
  onResult?: (res: PredictOut) => void;
};

/** Friendly, form-facing state */
type Form = {
  /** User enters HH:MM and we convert to hour (0–23) for the model */
  timeOfDay: string;
  amount: string;
  currency: string;
  age: string;
  gender: string;
  category: string;

  /** Transaction details (metadata only; not required by the model) */
  transactionId: string;
  merchant: string;
  zipcodeOri: string;
  zipMerchant: string;
};

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

/** Common ISO 4217 codes; extend as you like */
const CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD",
  "CHF", "SEK", "NOK", "DKK",
  "INR", "CNY", "HKD", "SGD", "KRW",
  "AED", "SAR", "TRY", "ZAR", "NGN", "KES", "EGP", "BRL", "MXN",
] as const;

/** Pretty labels while keeping original values */
function humanizeCategory(s: string) {
  return s.replace(/^\w\w_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function previewCurrency(amountStr: string, code: string) {
  const n = Number(amountStr);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(n);
  } catch {
    return `${code} ${n.toFixed(2)}`;
  }
}

export default function PredictionForm({ onResult }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Form>({
    timeOfDay: "",
    amount: "0",
    currency: "USD", // default currency
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
    const amountNum = Number(form.amount);
    const catOk = CATEGORY_OPTIONS.includes(form.category as any);
    const curOk = !!form.currency;
    return hasTime &&
      Number.isFinite(amountNum) && amountNum >= 0 &&
      !!form.age && !!form.gender && catOk && curOk;
  }, [form]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast({
        title: "Invalid input",
        description: "Please enter a time, non-negative amount, currency, and select age/gender/category.",
        variant: "destructive",
      });
      return;
    }

    // HH:MM → integer hour [0–23]
    const [hStr] = (form.timeOfDay || "0:00").split(":");
    const hNum = Number(hStr);
    const hour = Number.isFinite(hNum) && hNum >= 0 && hNum <= 23 ? hNum : 0;

    // Optional: derive a coarse period bucket if your backend expects it
    // const period = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    setLoading(true);
    try {
      const res = await predict({
        // Send both hour and step for compatibility with different backends
        hour,
        step: hour,
        amount: Number(form.amount),
        currency: form.currency as (typeof CURRENCY_OPTIONS)[number], // <-- NEW
        age: form.age,
        gender: form.gender,
        category: form.category as (typeof CATEGORY_OPTIONS)[number],
        // period, // uncomment if your API wants it
        // You can also include metadata if your backend supports it:
        // transactionId: form.transactionId,
        // merchant: form.merchant,
        // zipcodeOri: form.zipcodeOri,
        // zipMerchant: form.zipMerchant,
      } as any);
      onResult?.(res);
      toast({ title: "Analysis complete" });
    } catch (err: any) {
      toast({ title: "Prediction failed", description: err?.message ?? "Backend error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      {/* Core Features */}
      <fieldset className="border rounded-xl p-4">
        <legend className="px-2 text-sm font-semibold text-muted-foreground">Core Features</legend>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timeOfDay">Time of Day</Label>
            <Input
              id="timeOfDay"
              type="time"
              value={form.timeOfDay}
              onChange={(e) => setField("timeOfDay")(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Converted to <strong>hour</strong> (0–23) automatically.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setField("amount")(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Preview: {previewCurrency(form.amount, form.currency)}
              </p>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={setField("currency")}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Category (humanized labels) */}
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

      {/* Transaction Details */}
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
      </fieldset>

      <FraudButton
        type="submit"
        className="mt-1 w-full md:w-52"
        variant="gradient"
        size="lg"
        disabled={loading || !valid}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </FraudButton>
    </form>
  );
}
