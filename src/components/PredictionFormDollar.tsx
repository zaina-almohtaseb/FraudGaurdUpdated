// src/components/PredictionFormDollar.tsx
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FraudButton } from "@/components/ui/fraud-button";
import { useToast } from "@/hooks/use-toast";
import { predict, type PredictOut, CATEGORY_OPTIONS } from "@/lib/api";

type Props = { onResult?: (res: PredictOut) => void };

type Form = {
  timeOfDay: string;   // HH:MM -> convert to hour (0–23)
  amount: string;
  age: string;
  gender: string;
  category: string;
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

function humanizeCategory(s: string) {
  return s.replace(/^\w\w_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PredictionFormDollar({ onResult }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast({
        title: "Invalid input",
        description: "Please enter a time, non-negative amount, and select age/gender/category.",
        variant: "destructive",
      });
      return;
    }

    // HH:MM -> integer hour [0–23]
    const [hStr] = (form.timeOfDay || "0:00").split(":");
    const hNum = Number(hStr);
    const hour = Number.isFinite(hNum) && hNum >= 0 && hNum <= 23 ? hNum : 0;

    setLoading(true);
    try {
      const res = await predict({
        hour,
        step: hour, // keep for backend compatibility
        amount: Number(form.amount),
        age: form.age,
        gender: form.gender,
        category: form.category as (typeof CATEGORY_OPTIONS)[number],
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
    <form className="grid gap-6" onSubmit={onSubmit} data-testid="prediction-form-dollar">
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

          {/* Amount with static $ and no spinners */}
          <div>
            <Label htmlFor="amount">Amount ($) • Dollar prefix test</Label>
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
            <Input id="transactionId" value={form.transactionId} onChange={(e) => setField("transactionId")(e.target.value)} placeholder="e.g., TXN-123456" />
          </div>
          <div>
            <Label htmlFor="merchant">Merchant (optional)</Label>
            <Input id="merchant" value={form.merchant} onChange={(e) => setField("merchant")(e.target.value)} placeholder="e.g., M1826465P" />
          </div>
          <div>
            <Label htmlFor="zipcodeOri">Origin Zip (optional)</Label>
            <Input id="zipcodeOri" value={form.zipcodeOri} onChange={(e) => setField("zipcodeOri")(e.target.value)} placeholder="e.g., 28007" />
          </div>
          <div>
            <Label htmlFor="zipMerchant">Merchant Zip (optional)</Label>
            <Input id="zipMerchant" value={form.zipMerchant} onChange={(e) => setField("zipMerchant")(e.target.value)} placeholder="e.g., 28007" />
          </div>
        </div>
      </fieldset>

      <FraudButton type="submit" className="mt-1 w-full md:w-52" variant="gradient" size="lg" disabled={loading || !valid}>
        {loading ? "Analyzing..." : "Analyze"}
      </FraudButton>
    </form>
  );
}
