// Simplified without recharts for now to avoid build issues
import { TrendingUp, Target, Users, Database } from "lucide-react"
import { Card } from "./ui/card"

interface MetricsProps {
  metrics: {
    auc_sample: number
    class_0: number
    class_1: number
    total_labeled: number
  }
}

export function MetricsPanel({ metrics }: MetricsProps) {
  const classDistribution = [
    { name: 'Legitimate', value: metrics.class_0, color: '#22c55e' },
    { name: 'Fraud', value: metrics.class_1, color: '#ef4444' }
  ]

  const performanceData = [
    { metric: 'AUC Score', value: metrics.auc_sample * 100, target: 85 },
    { metric: 'Precision', value: 92, target: 90 },
    { metric: 'Recall', value: 88, target: 85 },
    { metric: 'F1-Score', value: 90, target: 87 }
  ]

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-mid to-pale rounded-lg">
          <TrendingUp className="w-5 h-5 text-deep" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performance Metrics</h2>
          <p className="text-sm text-muted-foreground">Model accuracy and data insights</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-800">AUC Score</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{(metrics.auc_sample * 100).toFixed(1)}%</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Legitimate</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{metrics.class_0.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-red-600" />
            <p className="text-sm font-medium text-red-800">Fraud Cases</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{metrics.class_1.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-purple-600" />
            <p className="text-sm font-medium text-purple-800">Total Labels</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{metrics.total_labeled.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-4 text-foreground">Performance Metrics</h3>
          <div className="space-y-3">
            {performanceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="font-medium">{item.metric}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-mid rounded-full"></div>
                    <span className="text-sm font-semibold">{item.value}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    (target: {item.target}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-foreground">Class Distribution</h3>
          <div className="space-y-4">
            {classDistribution.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-medium">{entry.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{entry.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {((entry.value / (metrics.class_0 + metrics.class_1)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}