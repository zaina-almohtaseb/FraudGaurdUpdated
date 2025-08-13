import { useState, useEffect } from "react"
import { Save, Tag, Database } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/Header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

interface LabelRecord {
  id: number
  raw_id: number
  fraud: 0 | 1
  timestamp: string
}

export function AdminLabels() {
  const [rawId, setRawId] = useState('')
  const [fraudLabel, setFraudLabel] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [recentLabels] = useState<LabelRecord[]>([
    { id: 1, raw_id: 1234, fraud: 1, timestamp: '2024-08-13T10:30:00Z' },
    { id: 2, raw_id: 1235, fraud: 0, timestamp: '2024-08-13T10:25:00Z' },
    { id: 3, raw_id: 1236, fraud: 1, timestamp: '2024-08-13T10:20:00Z' },
  ])
  
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/access-denied')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rawId || !fraudLabel) {
      toast({
        title: "Validation Error",
        description: "Please provide both Raw ID and Fraud Label",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setRawId('')
      setFraudLabel('')
      
      toast({
        title: "Label saved successfully",
        description: `Transaction ${rawId} labeled as ${fraudLabel === '1' ? 'Fraud' : 'Legitimate'}`,
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Label Transactions</h1>
          <p className="text-muted-foreground">Manually label transactions to improve model accuracy</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Label Form */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-deep to-mid rounded-lg">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Add Label</h2>
                <p className="text-sm text-muted-foreground">Label a transaction by its raw ID</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rawId">Transaction Raw ID *</Label>
                <Input
                  id="rawId"
                  type="number"
                  value={rawId}
                  onChange={(e) => setRawId(e.target.value)}
                  placeholder="Enter transaction ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fraudLabel">Fraud Label *</Label>
                <Select value={fraudLabel} onValueChange={setFraudLabel} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fraud status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Not Fraud (Legitimate)</SelectItem>
                    <SelectItem value="1">Fraud</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FraudButton 
                type="submit" 
                variant="gradient" 
                size="lg" 
                className="w-full gap-2"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Label'}
              </FraudButton>
            </form>
          </Card>

          {/* Recent Labels */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-mid to-pale rounded-lg">
                <Database className="w-5 h-5 text-deep" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Recent Labels</h2>
                <p className="text-sm text-muted-foreground">Recently labeled transactions</p>
              </div>
            </div>

            <div className="space-y-3">
              {recentLabels.map((label) => (
                <div 
                  key={label.id} 
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm bg-background px-2 py-1 rounded">
                      ID: {label.raw_id}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      label.fraud === 1 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {label.fraud === 1 ? 'Fraud' : 'Legitimate'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(label.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {recentLabels.length === 0 && (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No labels added yet</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}