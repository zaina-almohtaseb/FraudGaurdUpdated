// src/pages/AdminLabels.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/Header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Save, Database, Zap } from "lucide-react"

type LabelRow = {
  id: number
  is_fraud?: 0 | 1 | null
  labeled_at?: string
}

export default function AdminLabels() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) navigate("/auth", { replace: true })
    else if (user.role !== "admin") navigate("/access-denied", { replace: true })
  }, [user, navigate])

  const [rawId, setRawId] = useState("")
  const [fraudLabel, setFraudLabel] = useState<"0" | "1" | "">("")
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<LabelRow[]>([])

  const loadRecent = async () => {
    try {
      const res = await fetch("/labels/recent?limit=10")
      if (res.status === 404) return setRecent([])
      const t = await res.text()
      const data = t ? JSON.parse(t) : []
      const items: LabelRow[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
      setRecent(items)
    } catch {
      setRecent([])
    }
  }
  useEffect(() => { loadRecent() }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawId || fraudLabel === "") {
      toast({ title: "Missing fields", description: "Enter ID and choose label.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(rawId), is_fraud: Number(fraudLabel) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Save failed")
      toast({ title: "Saved", description: `Tx ${rawId} → ${fraudLabel === "1" ? "Fraud" : "Legit"}` })
      setRawId(""); setFraudLabel("")
      loadRecent()
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Request failed", variant: "destructive" })
    } finally { setLoading(false) }
  }

  // ---- Quick seed (testing) ----
  const [seedCount, setSeedCount] = useState(10)
  const [seedRatio, setSeedRatio] = useState(0.3)   // 30% fraud
  const [seeding, setSeeding] = useState(false)

  const quickSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch("/dev/quick-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n: seedCount, fraud_ratio: seedRatio, force_retrain: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Seed failed")
      const retrained = data?.retrained?.ok ? ` — retrained ✅ (v${data?.retrained?.model_version ?? ""})` : ""
      toast({ title: "Seed complete", description: `Created ${data.created} (${data.fraud_labeled} fraud)${retrained}` })
      loadRecent()
    } catch (err: any) {
      toast({ title: "Seed error", description: err?.message ?? "Request failed", variant: "destructive" })
    } finally { setSeeding(false) }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin — Labels</h1>
          <p className="text-muted-foreground">Label transactions and quickly generate test data.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Label form */}
          <Card className="p-6">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="rawId">Transaction ID *</Label>
                <Input id="rawId" type="number" min={1} value={rawId} onChange={(e) => setRawId(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Fraud Label *</Label>
                <Select value={fraudLabel} onValueChange={(v: "0" | "1") => setFraudLabel(v)}>
                  <SelectTrigger><SelectValue placeholder="Choose label" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Not Fraud (Legitimate)</SelectItem>
                    <SelectItem value="1">Fraud</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FraudButton type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> {loading ? "Saving..." : "Save Label"}
              </FraudButton>
            </form>
          </Card>

          {/* Quick Seed (testing) */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Quick Seed (testing)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seedCount">Rows to create</Label>
                <Input
                  id="seedCount"
                  type="number"
                  min={1}
                  value={seedCount}
                  onChange={(e) => setSeedCount(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seedRatio">Fraud ratio (0–1)</Label>
                <Input
                  id="seedRatio"
                  type="number"
                  min={0} max={1} step="0.05"
                  value={seedRatio}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isFinite(v)) return
                    setSeedRatio(Math.min(1, Math.max(0, v)))
                  }}
                />
              </div>
            </div>
            <FraudButton
              onClick={quickSeed}
              variant="gradient"
              size="lg"
              className="mt-4 w-full"
              disabled={seeding}
            >
              <Zap className="w-4 h-4 mr-2" /> {seeding ? "Seeding..." : "Create & Label"}
            </FraudButton>
            <p className="text-xs text-muted-foreground mt-2">
              Uses <code>/dev/quick-seed</code> to create labeled rows; retrains automatically when the threshold is met.
            </p>
          </Card>
        </div>

        {/* Recent labels */}
        <div className="grid lg:grid-cols-1 gap-8 mt-8">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Recent Labels</h2>
            </div>

            {(recent ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No labels yet.</p>
            ) : (
              <div className="space-y-3">
                {(recent ?? []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded border">
                    <div className="font-mono text-sm">ID: {r.id}</div>
                    <span
                      className={
                        r.is_fraud === 1
                          ? "px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                          : "px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      }
                    >
                      {r.is_fraud === 1 ? "Fraud" : "Legitimate"}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {r.labeled_at ? new Date(r.labeled_at).toLocaleString() : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
