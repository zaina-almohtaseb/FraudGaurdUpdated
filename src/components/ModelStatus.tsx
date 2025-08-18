// src/components/ui/ModelStatus.tsx
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Activity } from "lucide-react"
import type { ModelStatus as ModelStatusT } from "@/lib/api"
import { getModelStatus } from "@/lib/api"

export default function ModelStatus() {
  const { toast } = useToast()
  const [data, setData] = useState<ModelStatusT | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const s = await getModelStatus()
        if (alive) setData(s)
      } catch (err: any) {
        toast({
          title: "Couldn’t load model status",
          description: err?.message ?? "Backend error",
          variant: "destructive",
        })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [toast])

  return (
    <Card className="p-6 shadow-card bg-white/70">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#7a1d27]" />
          <h2 className="text-lg font-semibold text-[#3e0e12]">Model Status</h2>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Healthy</span>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : !data ? (
        <ErrorNote />
      ) : (
        <>
          <div className="grid md:grid-cols-5 gap-3">
            <Stat title="AUC" value={(data.performance_metric ?? 0).toFixed(3)} />
            <Stat title="Last Trained" value={data.last_trained || "—"} />
            <Stat title="Training Rows" value={fmtNum(data.training_samples)} />
            <Stat title="New Labeled" value={fmtNum(data.new_labeled)} />
            <Stat title="Model v" value={String(data.model_version ?? 0)} />
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-3">
            <Stat title="Total Tx" value={fmtNum(data.total_transactions)} />
            <Stat title="Labeled" value={fmtNum(data.labeled_transactions)} />
            <Stat title="Fraud Ratio" value={`${((data.fraud_ratio ?? 0) * 100).toFixed(1)}%`} />
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-[#3e0e12] mb-2">Expected Features</p>
            <div className="flex flex-wrap gap-2">
              {(data.features?.length ? data.features : ["step","amount","age","gender","category"]).map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 text-xs rounded-full bg-rose-100 text-[#7a1d27] border border-rose-200"
                >
                  {f}
                </span>
              ))}
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
      Could not load model data. Make sure the backend is running and accessible.
    </div>
  )
}

function fmtNum(n?: number) {
  return (n ?? 0).toLocaleString()
}
