// src/components/ui/PredictionForm.tsx
import { useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { predict, type PredictOut, CATEGORY_OPTIONS } from "@/lib/api"

type Props = {
  /** Called with the successful prediction response */
  onResult?: (res: PredictOut) => void
}

type Form = {
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

export default function PredictionForm({ onResult }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Form>({
    step: "0",
    amount: "0",
    age: "U",
    gender: "U",
    category: "",
  })

  const setField = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const valid = useMemo(() => {
    const s = Number(form.step)
    const a = Number(form.amount)
    const catOk = CATEGORY_OPTIONS.includes(form.category as any)
    return Number.isFinite(s) && s >= 0 &&
           Number.isFinite(a) && a >= 0 &&
           !!form.age && !!form.gender && catOk
  }, [form])

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
        step: Number(form.step),
        amount: Number(form.amount),
        age: form.age,
        gender: form.gender,
        category: form.category as (typeof CATEGORY_OPTIONS)[number],
      })
      onResult?.(res)
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
          <Input
            id="step"
            type="number"
            min={0}
            value={form.step}
            onChange={(e) => setField("step")(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => setField("amount")(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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
  )
}
