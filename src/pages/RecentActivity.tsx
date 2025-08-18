// src/pages/RecentActivity.tsx
import { useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { Database, Gauge, RefreshCcw } from "lucide-react"

type TxItem = {
  id: number
  amount?: number
  step?: number
  age?: string
  gender?: string
  category?: string
  prediction?: number
  probability_fraud?: number
  ts?: string
  timestamp?: string
  labeled_at?: string
  is_fraud?: 0 | 1 | null
}

async function fetchRecent(path: string, limit: number): Promise<TxItem[]> {
  const url = `${path}?limit=${limit}`
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } })
  if (res.status === 404) return [] // backend not implemented yet → show empty
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `${res.status} ${res.statusText}`
    throw new Error(message)
  }
  if (Array.isArray(data)) return data as TxItem[]
  if (Array.isArray(data?.items)) return data.items as TxItem[]
  return []
}

export default function RecentActivity() {
  const { toast } = useToast()
  const [limit, setLimit] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [preds, setPreds] = useState<TxItem[]>([])
  const [labels, setLabels] = useState<TxItem[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const [p, l] = await Promise.all([
        fetchRecent("/transactions/recent", limit),
        fetchRecent("/labels/recent", limit),
      ])
      setPreds(p)
      setLabels(l)
    } catch (err: any) {
      toast({
        title: "Couldn’t load recent activity",
        description: err?.message ?? "Please ensure the backend is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#f1d8cf]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#3e0e12]">Recent Activity</h1>
            <p className="text-sm text-[#6f3a3d]">Latest predictions and labels from your fraud pipeline</p>
          </div>

          <div className="flex items-end gap-3">
            <div className="grid">
              <Label htmlFor="limit" className="text-xs text-[#6f3a3d]">Show last N items</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Number(e.target.value || 1)))}
                className="w-24"
              />
            </div>
            <FraudButton
              onClick={load}
              variant="gradient"     // supported variant in your project
              size="sm"
              disabled={loading}
              className="flex gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </FraudButton>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Predictions */}
          <Card className="p-6 shadow-card bg-white/70">
            <SectionHeader icon={<Gauge className="w-5 h-5 text-[#7a1d27]" />} title="Recent Predictions" right={`Last ${limit}`} />
            {loading ? <SkeletonList /> : preds.length === 0 ? (
              <EmptyState text="No predictions yet" />
            ) : (
              <ul className="space-y-3">
                {preds.map((p) => (
                  <li key={p.id} className="p-3 rounded-lg border bg-white/70 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-[#3e0e12]">
                        Tx #{p.id} &middot; {p.category ?? "—"}
                      </div>
                      <div className="text-xs text-[#6f3a3d]">
                        Amount: <span className="font-mono">{p.amount ?? "—"}</span> ·
                        <span className="ml-1">Step: <span className="font-mono">{p.step ?? "—"}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#6f3a3d]">Fraud Probability</div>
                      <div className="text-lg font-bold text-[#7a1d27]">
                        {(((p.probability_fraud ?? p.prediction) ?? 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-[#6f3a3d] mt-1">
                        {new Date(p.timestamp || p.ts || "").toLocaleString() || "—"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent Labels */}
          <Card className="p-6 shadow-card bg-white/70">
            <SectionHeader icon={<Database className="w-5 h-5 text-[#7a1d27]" />} title="Recent Labels" right={`Last ${limit}`} />
            {loading ? <SkeletonList /> : labels.length === 0 ? (
              <EmptyState text="No labels yet" />
            ) : (
              <ul className="space-y-3">
                {labels.map((l) => (
                  <li key={l.id} className="p-3 rounded-lg border bg-white/70 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-[#3e0e12]">Tx #{l.id}</div>
                      <div className="text-xs text-[#6f3a3d]">
                        {new Date(l.labeled_at || "").toLocaleString() || "—"}
                      </div>
                    </div>
                    <span
                      className={[
                        "px-2 py-1 rounded-full text-xs font-medium",
                        l.is_fraud === 1 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
                      ].join(" ")}
                    >
                      {l.is_fraud === 1 ? "Fraud" : "Legitimate"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

function SectionHeader({ icon, title, right }: { icon: JSX.Element; title: string; right?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-[#3e0e12]">{title}</h2>
      </div>
      {right ? <span className="text-xs text-[#6f3a3d]">{right}</span> : null}
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-14 bg-white/50 rounded" />
      <div className="h-14 bg-white/50 rounded" />
      <div className="h-14 bg-white/50 rounded" />
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center text-[#6f3a3d] py-10">{text}</div>
}
