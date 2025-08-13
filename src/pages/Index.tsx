import { useState } from "react"
import { Header } from "@/components/Header"
import { PredictionForm } from "@/components/PredictionForm"
import { ModelStatus } from "@/components/ModelStatus"
import { MetricsPanel } from "@/components/MetricsPanel"

// Mock data for demo
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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Fraud Detection Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Submit transaction details for real-time fraud analysis using advanced machine learning
          </p>
        </div>

        <div className="space-y-8">
          <PredictionForm />
          
          <div className="grid lg:grid-cols-2 gap-8">
            <ModelStatus status={mockModelStatus} />
            <MetricsPanel metrics={mockMetrics} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
