import { Shield, User, Settings, Tag } from "lucide-react"
import { FraudButton } from "./ui/fraud-button"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const userRole = user?.role || 'guest'
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-deep to-mid rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">FraudGuard</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Detection Portal</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-4">
            {userRole === 'admin' && (
              <div className="flex gap-2">
                <Link to="/admin">
                  <FraudButton variant={location.pathname === '/admin' ? 'admin' : 'outline'} size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Dashboard
                  </FraudButton>
                </Link>
                <Link to="/admin/labels">
                  <FraudButton variant={location.pathname === '/admin/labels' ? 'admin' : 'outline'} size="sm" className="gap-2">
                    <Tag className="w-4 h-4" />
                    Labels
                  </FraudButton>
                </Link>
              </div>
            )}
            
            {userRole === 'guest' ? (
              <div className="flex gap-2">
                <FraudButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </FraudButton>
                <FraudButton 
                  variant="gradient" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  Admin Login
                </FraudButton>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground capitalize">{userRole}</span>
                </div>
                <FraudButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  Sign Out
                </FraudButton>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}