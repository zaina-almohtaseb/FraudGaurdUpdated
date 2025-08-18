// src/components/ui/MetricsPanel.tsx
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Gauge } from "lucide-react"
import type { ModelMetrics as ModelMetricsT } from "@/lib/api"
import { getModelMetrics } from "@/lib/api"

export default function MetricsPanel() {
  const { toast } = useToast()
  const [data, setData] = useState<ModelMetricsT | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const m = await getModelMetrics()
        if (alive) setData(m)
      } catch (err: any) {
        toast({
          title: "Couldn’t load performance metrics",
          description: err?.message ?? "Backend error",
          variant: "destructive",
        })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [toast])

  const legit = data?.class_0 ?? 0
  const fraud = data?.class_1 ?? 0
  const labeled = data?.labeled_transactions ?? legit + fraud
  const fraudRatio = data ? (data.fraud_ratio ?? (labeled ? fraud / labeled : 0)) : 0

  return (
    <Card className="p-6 shadow-card bg-white/70">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-[#7a1d27]" />
          <h2 className="text-lg font-semibold text-[#3e0e12]">Performance Metrics</h2>
        </div>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : !data ? (
        <ErrorNote />
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-3">
            <Stat title="Legitimate" value={fmtNum(legit)} />
            <Stat title="Fraud" value={fmtNum(fraud)} />
            <Stat title="Total Labels" value={fmtNum(labeled)} />
            <Stat title="Fraud Ratio" value={`${(fraudRatio * 100).toFixed(1)}%`} />
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-[#3e0e12] mb-2">Class Distribution</p>
            <Bar legit={legit} fraud={fraud} />
            <div className="mt-2 flex items-center justify-between text-xs text-[#6f3a3d]">
              <span>Legitimate: {fmtNum(legit)}</span>
              <span>Fraud: {fmtNum(fraud)}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

/* ---------------- helpers ---------------- */
function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border bg-white/70 border-rose-100 text-[#3e0e12]">
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function Bar({ legit, fraud }: { legit: number; fraud: number }) {
  const total = Math.max(1, legit + fraud)
  const legitPct = (legit / total) * 100
  const fraudPct = (fraud / total) * 100
  return (
    <div className="w-full h-3 rounded bg-slate-200 overflow-hidden border">
      <div
        className="h-full bg-green-400"
        style={{ width: `${legitPct}%` }}
        title={`Legitimate ${legitPct.toFixed(1)}%`}
      />
      <div
        className="h-full bg-red-400 -mt-3"
        style={{ width: `${fraudPct}%` }}
        title={`Fraud ${fraudPct.toFixed(1)}%`}
      />
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="animate-pulse grid gap-3">
      <div className="h-20 bg-white/50 rounded" />
      <div className="h-20 bg-white/50 rounded" />
      <div className="h-20 bg-white/50 rounded" />
    </div>
  )
}

function ErrorNote() {
  return (
    <div className="p-4 rounded-lg border bg-rose-50 text-rose-800">
      Could not load metrics. Make sure the backend is running and accessible.
    </div>
  )
}

function fmtNum(n?: number) {
  return (n ?? 0).toLocaleString()
}
