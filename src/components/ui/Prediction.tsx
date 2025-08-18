// src/components/ui/Prediction.tsx
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { Gauge } from "lucide-react"
import { predict, type PredictOut, CATEGORY_OPTIONS } from "@/lib/api"

/* ----------------------------- Top-level page ----------------------------- */
export default function Prediction() {
  const [res, setRes] = useState<PredictOut | null>(null)

  return (
    <Card className="p-6 shadow-card bg-white/70">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#3e0e12]">Fraud Detection</h2>
            <p className="text-sm text-[#6f3a3d]">
              Enter step, amount, age, gender, and category to analyze a transaction
            </p>
          </div>
          <Form onResult={setRes} />
        </div>

        {/* Right: Result */}
        <div className="min-h-[260px] flex items-center justify-center">
          {!res ? <ReadyState /> : <ResultCard res={res} />}
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------ Inline form ------------------------------- */
type FormVals = {
  step: string
  amount: string
  age: string
  gender: string
  category: string
}

const AGE_OPTIONS = [
  { value: "0", label: "0 (≤18)" },
  { value: "1", label: "1 (19–25)" },
  { value: "2", label: "2 (26–35)" },
  { value: "3", label: "3 (36–45)" },
  { value: "4", label: "4 (46–55)" },
  { value: "5", label: "5 (56–65)" },
  { value: "6", label: "6 (>65)" },
  { value: "U", label: "U (Unknown)" },
]

const GENDER_OPTIONS = [
  { value: "M", label: "M" },
  { value: "F", label: "F" },
  { value: "U", label: "U" },
  { value: "E", label: "E (Enterprise)" },
]

function Form({ onResult }: { onResult: (r: PredictOut) => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [f, setF] = useState<FormVals>({ step: "0", amount: "0", age: "U", gender: "U", category: "" })

  const setField = (k: keyof FormVals) => (v: string) => setF((s) => ({ ...s, [k]: v }))

  const valid = useMemo(() => {
    const s = Number(f.step)
    const a = Number(f.amount)
    const catOk = CATEGORY_OPTIONS.includes(f.category as any)
    return Number.isFinite(s) && s >= 0 &&
           Number.isFinite(a) && a >= 0 &&
           !!f.age && !!f.gender && catOk
  }, [f])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) {
      toast({
        title: "Invalid input",
        description: "Step & Amount must be non-negative. Age, Gender, and Category are required.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const res = await predict({
        step: Number(f.step),
        amount: Number(f.amount),
        age: f.age,
        gender: f.gender,
        category: f.category as (typeof CATEGORY_OPTIONS)[number],
      })
      onResult(res)
      toast({ title: "Analysis complete" })
    } catch (err: any) {
      toast({ title: "Prediction failed", description: err?.message ?? "Backend error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="step">Step (hours)</Label>
          <Input id="step" type="number" min={0} value={f.step} onChange={(e) => setField("step")(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" min={0} step="0.01" value={f.amount} onChange={(e) => setField("amount")(e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Age</Label>
          <Select value={f.age} onValueChange={setField("age")}>
            <SelectTrigger><SelectValue placeholder="Age bucket" /></SelectTrigger>
            <SelectContent>
              {AGE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Gender</Label>
          <Select value={f.gender} onValueChange={setField("gender")}>
            <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category</Label>
          <Select value={f.category} onValueChange={setField("category")}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FraudButton type="submit" className="mt-2 w-full md:w-52" variant="gradient" size="lg" disabled={loading || !valid}>
        {loading ? "Analyzing..." : "Analyze"}
      </FraudButton>
    </form>
  )
}

/* ------------------------------ Result panel ------------------------------ */
function ReadyState() {
  return (
    <div className="text-center text-[#5d2a2d]">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
        <Gauge className="w-6 h-6 text-[#7a1d27]" />
      </div>
      <h3 className="font-semibold">Ready to analyze</h3>
      <p className="text-sm text-[#6f3a3d]">Submit details to get a fraud probability</p>
    </div>
  )
}

function ResultCard({ res }: { res: PredictOut }) {
  const prob = (res.probability_fraud ?? res.prediction ?? 0) * 100
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-[#3e0e12] mb-2">Analysis Results</h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <Tile label="Fraud Probability" value={`${prob.toFixed(2)}%`} styleClass="bg-green-50 border-green-100 text-green-800" />
        <Tile label="Transaction ID" value={`#${res.id}`} styleClass="bg-rose-50 border-rose-100 text-rose-800" />
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
        <KV label="Step" value={String(res.step)} />
        <KV label="Amount" value={res.amount.toFixed(2)} />
        <KV label="Age" value={res.age} />
        <KV label="Gender" value={res.gender} />
        <KV label="Category" value={res.category} />
        {typeof res.hour === "number" && <KV label="Hour" value={String(res.hour)} />}
        {res.period && <KV label="Period" value={res.period} />}
        <KV label="Model Version" value={String(res.model_version ?? 0)} />
        <KV label="Timestamp" value={res.timestamp ?? "—"} />
      </div>
    </div>
  )
}

function Tile({ label, value, styleClass }: { label: string; value: string; styleClass?: string }) {
  return (
    <div className={`p-4 rounded-lg border ${styleClass ?? "bg-white/70 border-rose-100 text-[#3e0e12]"}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-white/70 border">
      <span className="text-[#6f3a3d]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
