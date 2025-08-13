import { useState, useEffect } from "react"
import { RefreshCw, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/Header"
import { ModelStatus } from "@/components/ModelStatus"
import { MetricsPanel } from "@/components/MetricsPanel"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

// Mock data
const mockModelStatus = {
  model_version: "v2.1.3",
  last_trained: "2024-08-12T14:30:00Z",
  expected_features: ["step", "amount", "age", "gender", "category", "merchant", "zipcodeOri", "zipMerchant"],
  retrain_threshold: 100,
  new_labeled: 85,
  rows_trained_last: 45672,
  auc_last: 0.892,
  train_time_s: 284
}

const mockMetrics = {
  auc_sample: 0.887,
  class_0: 8742,
  class_1: 1258,
  total_labeled: 10000
}

export function AdminDashboard() {
  const [modelStatus, setModelStatus] = useState(mockModelStatus)
  const [metrics, setMetrics] = useState(mockMetrics)
  const [loading, setLoading] = useState(false)
  const [retraining, setRetraining] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth')
    }
  }, [user, navigate])

  const handleRefresh = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Data refreshed",
        description: "Model status and metrics updated successfully",
      })
    }, 1000)
  }

  const handleRetrain = async () => {
    setRetraining(true)
    // Simulate retraining process
    setTimeout(() => {
      const newVersion = `v${parseInt(modelStatus.model_version.slice(1)) + 0.1}`
      setModelStatus(prev => ({
        ...prev,
        model_version: newVersion,
        last_trained: new Date().toISOString(),
        new_labeled: 0,
        auc_last: 0.895 + Math.random() * 0.02
      }))
      setRetraining(false)
      toast({
        title: "Model retrained successfully",
        description: `Updated to ${newVersion} with improved performance`,
      })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage the fraud detection system</p>
          </div>
          
          <div className="flex gap-3">
            <FraudButton
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </FraudButton>
            
            <FraudButton
              variant="gradient"
              onClick={handleRetrain}
              disabled={retraining}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              {retraining ? 'Retraining...' : 'Retrain Model'}
            </FraudButton>
          </div>
        </div>

        <div className="space-y-8">
          <ModelStatus status={modelStatus} />
          <MetricsPanel metrics={metrics} />
        </div>
      </main>
    </div>
  )
}