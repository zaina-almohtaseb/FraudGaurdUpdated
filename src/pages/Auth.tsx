// src/pages/Auth.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/Header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FraudButton } from "@/components/ui/fraud-button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Minimal sign-in page that works with your AuthContext.
 * - Tries `auth.login(email, password, role)` if available.
 * - Otherwise falls back to `auth.setUser({...})`.
 */

export default function Auth() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Keep flexible in case your AuthContext shape changes.
  const auth = useAuth() as any

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "user">("user")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (typeof auth?.login === "function") {
        await auth.login(email, password, role)
      } else if (typeof auth?.setUser === "function") {
        auth.setUser({
          id: Date.now(),
          email,
          role,
          name: email.split("@")[0],
        })
      }

      toast({
        title: "Signed in",
        description: role === "admin" ? "Welcome, Admin." : "Welcome!",
      })

      // Change the admin route here if your app uses a different path
      navigate(role === "admin" ? "/admin/labels" : "/")
    } catch (err: any) {
      toast({
        title: "Sign-in failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6 shadow-card">
            <h1 className="text-2xl font-semibold text-foreground mb-1">Sign in</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Use any email &amp; password for now. Choose a role to test admin-only routes.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as "admin" | "user")} // <-- accept string, cast inside
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FraudButton
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </FraudButton>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
