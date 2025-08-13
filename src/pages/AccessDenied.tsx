import { Shield, Lock } from "lucide-react"
import { FraudButton } from "@/components/ui/fraud-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"

export function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-deep to-mid rounded-xl mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-lg mx-auto mb-4">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in as an admin to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please sign in with an admin account to continue.
            </p>
            
            <div className="flex flex-col gap-2">
              <Link to="/auth">
                <FraudButton variant="gradient" className="w-full">
                  Sign In
                </FraudButton>
              </Link>
              <Link to="/">
                <FraudButton variant="outline" className="w-full">
                  Go Home
                </FraudButton>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}