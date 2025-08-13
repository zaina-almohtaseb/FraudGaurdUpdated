import { Activity, Clock, Database, Zap } from "lucide-react"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"

interface ModelStatusProps {
  status: {
    model_version: string
    last_trained: string
    expected_features: string[]
    retrain_threshold: number
    new_labeled: number
    rows_trained_last: number
    auc_last: number
    train_time_s: number
  }
}

export function ModelStatus({ status }: ModelStatusProps) {
  const isHealthy = status.auc_last > 0.8
  const needsRetrain = status.new_labeled >= status.retrain_threshold

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-deep to-mid rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Model Status</h2>
            <p className="text-sm text-muted-foreground">Current AI model information</p>
          </div>
        </div>
        <Badge variant={isHealthy ? "default" : "destructive"}>
          {isHealthy ? 'Healthy' : 'Needs Attention'}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-mid" />
            <p className="text-sm font-medium">Version</p>
          </div>
          <p className="text-lg font-bold text-foreground">{status.model_version}</p>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-mid" />
            <p className="text-sm font-medium">Last Trained</p>
          </div>
          <p className="text-sm text-foreground">{new Date(status.last_trained).toLocaleDateString()}</p>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-mid" />
            <p className="text-sm font-medium">Training Rows</p>
          </div>
          <p className="text-lg font-bold text-foreground">{status.rows_trained_last.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-mid" />
            <p className="text-sm font-medium">AUC Score</p>
          </div>
          <p className={`text-lg font-bold ${isHealthy ? 'text-green-600' : 'text-destructive'}`}>
            {status.auc_last.toFixed(3)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Expected Features ({status.expected_features.length})</h3>
          <div className="flex flex-wrap gap-2">
            {status.expected_features.map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Retrain Threshold</p>
            <p className="font-semibold">{status.retrain_threshold} labels</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">New Labels</p>
            <p className={`font-semibold ${needsRetrain ? 'text-orange-600' : 'text-foreground'}`}>
              {status.new_labeled}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Train Time</p>
            <p className="font-semibold">{status.train_time_s}s</p>
          </div>
        </div>

        {needsRetrain && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Model retrain recommended: {status.new_labeled} new labels available (threshold: {status.retrain_threshold})
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}