import { useState } from "react"
import { AlertCircle, Brain, TrendingUp } from "lucide-react"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { FraudButton } from "./ui/fraud-button"
import { Alert, AlertDescription } from "./ui/alert"

interface PredictionFormData {
  step: string
  amount: string
  age: string
  gender: string
  category: string
  merchant?: string
  zipcodeOri?: string
  zipMerchant?: string
}

interface PredictionResult {
  fraud_prediction: 0 | 1
  fraud_probability: number
  raw_id: number
  retrain: {
    should_retrain: boolean
    new_records: number
    threshold: number
  }
}

export function PredictionForm() {
  const [formData, setFormData] = useState<PredictionFormData>({
    step: '',
    amount: '',
    age: '',
    gender: '',
    category: '',
    merchant: '',
    zipcodeOri: '',
    zipMerchant: ''
  })
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.step || parseInt(formData.step) < 0) {
      newErrors.step = 'Step must be a positive number'
    }
    if (!formData.amount || parseFloat(formData.amount) < 0) {
      newErrors.amount = 'Amount must be a positive number'
    }
    if (!formData.age) {
      newErrors.age = 'Age is required'
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    // Simulate API call with mock data
    setTimeout(() => {
      const mockResult: PredictionResult = {
        fraud_prediction: Math.random() > 0.7 ? 1 : 0,
        fraud_probability: Math.random(),
        raw_id: Math.floor(Math.random() * 10000),
        retrain: {
          should_retrain: Math.random() > 0.8,
          new_records: Math.floor(Math.random() * 50),
          threshold: 100
        }
      }
      setResult(mockResult)
      setLoading(false)
    }, 1500)
  }

  const updateField = (field: keyof PredictionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-deep to-mid rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Fraud Detection</h2>
            <p className="text-sm text-muted-foreground">Submit transaction details for AI analysis</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="step">Step *</Label>
              <Input
                id="step"
                type="number"
                min="0"
                value={formData.step}
                onChange={(e) => updateField('step', e.target.value)}
                className={errors.step ? 'border-destructive' : ''}
              />
              {errors.step && (
                <p className="text-sm text-destructive">{errors.step}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Select value={formData.age} onValueChange={(value) => updateField('age', value)}>
                <SelectTrigger className={errors.age ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U">Unknown</SelectItem>
                  <SelectItem value="0">0-9</SelectItem>
                  <SelectItem value="1">10-19</SelectItem>
                  <SelectItem value="2">20-29</SelectItem>
                  <SelectItem value="3">30-39</SelectItem>
                  <SelectItem value="4">40-49</SelectItem>
                  <SelectItem value="5">50-59</SelectItem>
                  <SelectItem value="6">60-69</SelectItem>
                  <SelectItem value="7">70-79</SelectItem>
                  <SelectItem value="8">80+</SelectItem>
                </SelectContent>
              </Select>
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
                <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="U">Unknown</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select transaction category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es_transport">Transport</SelectItem>
                <SelectItem value="es_food">Food & Dining</SelectItem>
                <SelectItem value="es_health">Health & Medical</SelectItem>
                <SelectItem value="es_fashion">Fashion & Clothing</SelectItem>
                <SelectItem value="es_home">Home & Garden</SelectItem>
                <SelectItem value="es_entertainment">Entertainment</SelectItem>
                <SelectItem value="es_others">Others</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input
                id="merchant"
                value={formData.merchant}
                onChange={(e) => updateField('merchant', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipcodeOri">Origin Zipcode</Label>
              <Input
                id="zipcodeOri"
                value={formData.zipcodeOri}
                onChange={(e) => updateField('zipcodeOri', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipMerchant">Merchant Zipcode</Label>
              <Input
                id="zipMerchant"
                value={formData.zipMerchant}
                onChange={(e) => updateField('zipMerchant', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <FraudButton 
            type="submit" 
            variant="gradient" 
            size="lg" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Transaction'}
          </FraudButton>
        </form>
      </Card>

      {/* Results Panel */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-mid to-pale rounded-lg">
            <TrendingUp className="w-5 h-5 text-deep" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Analysis Results</h2>
            <p className="text-sm text-muted-foreground">AI fraud detection output</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Processing transaction...</p>
          </div>
        ) : result ? (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border-2 ${
              result.fraud_prediction === 1 
                ? 'border-destructive bg-destructive/5' 
                : 'border-green-500 bg-green-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`w-5 h-5 ${
                  result.fraud_prediction === 1 ? 'text-destructive' : 'text-green-600'
                }`} />
                <h3 className="font-semibold">
                  {result.fraud_prediction === 1 ? 'FRAUD DETECTED' : 'LEGITIMATE TRANSACTION'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Fraud Probability: {(result.fraud_probability * 100).toFixed(1)}%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-mono font-semibold">{result.raw_id}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="font-semibold">{(Math.abs(result.fraud_probability - 0.5) * 200).toFixed(1)}%</p>
              </div>
            </div>

            {result.retrain.should_retrain && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Model retrain recommended: {result.retrain.new_records} new records available 
                  (threshold: {result.retrain.threshold})
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Ready to analyze</p>
              <p className="text-sm text-muted-foreground">Submit transaction details to get fraud prediction</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}