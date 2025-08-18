// src/pages/Index.tsx
import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/Header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { Activity, Gauge } from "lucide-react"

/** Small fetch helper using relative paths (works with your Vite proxy) */
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  })
  const text = await res.text()
  let data: any = text
  try { data = text ? JSON.parse(text) : null } catch {}
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `${res.status} ${res.statusText}`
    throw new Error(msg)
  }
  return data as T
}

type PredictOut = {
  id: number
  probability_fraud?: number
  prediction?: number
  step: number
  amount: number
  age: string
  gender: string
  category: string
  hour?: number
  period?: string
  timestamp?: string
}

type StatusOut = {
  last_trained: string | null
  features: string[]
  retrain_threshold: number
  new_labeled: number
  performance_metric: number
  training_samples: number
}

type MetricsOut = {
  total_transactions: number
  labeled_transactions: number
  fraud_ratio: number
  class_0: number
  class_1: number
}

type Form = {
  step: string
  amount: string
  age: string
  gender: string
  category: string
}

/* ---------- Fixed dropdowns ---------- */
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

/** EXACT categories from the dataset (normalized) */
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
] as const

export default function Index() {
  const { toast } = useToast()

  const [form, setForm] = useState<Form>({
    step: "0",
    amount: "0",
    age: "U",
    gender: "U",
    category: "", // must pick from CATEGORY_OPTIONS
  })
  const [loading, setLoading] = useState(false)
  const [pred, setPred] = useState<PredictOut | null>(null)

  const [status, setStatus] = useState<StatusOut | null>(null)
  const [metrics, setMetrics] = useState<MetricsOut | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Load model status + metrics
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [s, m] = await Promise.all([req<StatusOut>("/model/status"), req<MetricsOut>("/model/metrics")])
        if (!mounted) return
        setStatus(s)
        setMetrics(m)
      } catch (err: any) {
        toast({
          title: "Couldn’t load model status",
          description: err?.message ?? "Please ensure the backend is running.",
          variant: "destructive",
        })
      } finally {
        if (mounted) setLoadingStats(false)
      }
    })()
    return () => { mounted = false }
  }, [toast])

  const setField = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const valid = useMemo(() => {
    const s = Number(form.step)
    const a = Number(form.amount)
    const catOk = CATEGORY_OPTIONS.includes(form.category as any)
    return Number.isFinite(s) && s >= 0 &&
           Number.isFinite(a) && a >= 0 &&
           !!form.age && !!form.gender && catOk
  }, [form])

  const onAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) {
      toast({
        title: "Invalid input",
        description: "Step & Amount must be non-negative. Age/Gender/Category are required.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setPred(null)
    try {
      const payload = {
        step: Number(form.step),
        amount: Number(form.amount),
        age: form.age.trim(),
        gender: form.gender.trim(),
        category: form.category as typeof CATEGORY_OPTIONS[number],
      }
      const p = await req<PredictOut>("/predict", { method: "POST", body: JSON.stringify(payload) })
      setPred(p)
      toast({ title: "Analysis complete" })
    } catch (err: any) {
      toast({ title: "Prediction failed", description: err?.message ?? "Backend error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f1d8cf]">
      <Header />

      <main className="container mx-auto px-4 py-10">
        {/* Hero */}
        <section className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#3e0e12]">
            AI Fraud Detection Portal
          </h1>
          <p className="mt-3 text-[#5d2a2d] max-w-3xl mx-auto">
            Submit transaction details for real-time fraud analysis using your trained model
          </p>
        </section>

        {/* Top grid: Form + Results */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* FORM */}
          <Card className="p-6 shadow-card bg-white/70">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#7a1d27]" />
                <h2 className="text-lg font-semibold text-[#3e0e12]">Fraud Detection</h2>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Healthy</span>
            </div>

            <form className="grid gap-4" onSubmit={onAnalyze}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="step">Step (hours)</Label>
                  <Input id="step" type="number" min={0} value={form.step} onChange={(e) => setField("step")(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setField("amount")(e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Age */}
                <div>
                  <Label>Age</Label>
                  <Select value={form.age} onValueChange={setField("age")}>
                    <SelectTrigger><SelectValue placeholder="Age bucket" /></SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map(opt => (
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
                      {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category (locked to dataset values) */}
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={setField("category")}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FraudButton
                type="submit"
                className="mt-2 w-full md:w-52"
                variant="gradient"
                size="lg"
                disabled={loading || !valid}
              >
                {loading ? "Analyzing..." : "Analyze"}
              </FraudButton>
            </form>
          </Card>

          {/* RESULTS */}
          <Card className="p-6 shadow-card bg-white/70 min-h-[280px] flex items-center justify-center">
            {!pred ? (
              <div className="text-center text-[#5d2a2d]">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-[#7a1d27]" />
                </div>
                <h3 className="font-semibold">Ready to analyze</h3>
                <p className="text-sm text-[#6f3a3d]">Enter step, amount, age, gender, and category</p>
              </div>
            ) : (
              <div className="w-full">
                <h3 className="text-lg font-semibold text-[#3e0e12] mb-2">Analysis Results</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                    <div className="text-sm text-green-700">Fraud Probability</div>
                    <div className="text-2xl font-bold text-green-800">
                      {(((pred.probability_fraud ?? pred.prediction) ?? 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
                    <div className="text-sm text-rose-700">Transaction ID</div>
                    <div className="text-2xl font-bold text-rose-800">{pred.id}</div>
                  </div>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Step" value={pred.step} />
                  <InfoRow label="Amount" value={pred.amount} />
                  <InfoRow label="Age" value={pred.age} />
                  <InfoRow label="Gender" value={pred.gender} />
                  <InfoRow label="Category" value={pred.category} />
                  {pred.hour !== undefined && <InfoRow label="Hour" value={pred.hour} />}
                  {pred.period && <InfoRow label="Period" value={pred.period} />}
                  <InfoRow label="Timestamp" value={pred.timestamp || "—"} />
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Bottom grid: Status + Metrics */}
        <section className="grid lg:grid-cols-2 gap-6 mt-6">
          <Card className="p-6 shadow-card bg-white/70">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#7a1d27]" />
                <h2 className="text-lg font-semibold text-[#3e0e12]">Model Status</h2>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Healthy</span>
            </div>

            {loadingStats ? (
              <SkeletonRows />
            ) : status ? (
              <>
                <div className="grid md:grid-cols-4 gap-3">
                  <StatCard title="AUC" value={(status.performance_metric ?? 0).toFixed(3)} />
                  <StatCard title="Last Trained" value={status.last_trained || "—"} />
                  <StatCard title="Training Rows" value={status.training_samples?.toLocaleString() ?? "—"} />
                  <StatCard title="Threshold" value={status.retrain_threshold} />
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-[#3e0e12] mb-2">Expected Features</p>
                  <div className="flex flex-wrap gap-2">
                    {(status.features?.length ? status.features : ["step","amount","age","gender","category"]).map((f) => (
                      <span key={f} className="px-3 py-1 text-xs rounded-full bg-rose-100 text-[#7a1d27] border border-rose-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <ErrorNote />
            )}
          </Card>

          <Card className="p-6 shadow-card bg-white/70">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-[#7a1d27]" />
                <h2 className="text-lg font-semibold text-[#3e0e12]">Performance Metrics</h2>
              </div>
            </div>

            {loadingStats ? (
              <SkeletonRows />
            ) : metrics ? (
              <>
                <div className="grid md:grid-cols-4 gap-3">
                  <StatCard title="Legitimate" value={metrics.class_0?.toLocaleString() ?? "—"} />
                  <StatCard title="Fraud" value={metrics.class_1?.toLocaleString() ?? "—"} />
                  <StatCard title="Total Labels" value={metrics.labeled_transactions?.toLocaleString() ?? "—"} />
                  <StatCard title="Fraud Ratio" value={`${((metrics.fraud_ratio ?? 0) * 100).toFixed(1)}%`} />
                </div>
              </>
            ) : (
              <ErrorNote />
            )}
          </Card>
        </section>
      </main>
    </div>
  )
}

/* -------------------- small UI helpers -------------------- */
function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-white/70 border">
      <span className="text-[#6f3a3d]">{label}</span>
      <span className="font-mono">{String(value)}</span>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 rounded-lg border bg-white/70 border-rose-100 text-[#3e0e12]">
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="animate-pulse grid gap-3">
      <div className="h-24 bg-white/50 rounded" />
      <div className="h-24 bg-white/50 rounded" />
      <div className="h-24 bg-white/50 rounded" />
    </div>
  )
}

function ErrorNote() {
  return (
    <div className="p-4 rounded-lg border bg-rose-50 text-rose-800">
      Could not load model data. Make sure the backend is running and accessible.
    </div>
  )
}
