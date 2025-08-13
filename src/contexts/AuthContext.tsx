import { createContext, useContext, useState, ReactNode } from 'react'

type UserRole = 'guest' | 'user' | 'admin'

interface User {
  id: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo
const MOCK_USERS = [
  { id: '1', email: 'admin@demo.com', password: 'admin123', role: 'admin' as UserRole },
  { id: '2', email: 'user@demo.com', password: 'user123', role: 'user' as UserRole },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password)
    
    if (mockUser) {
      const user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      }
      setUser(user)
      // Store user for redirect logic
      localStorage.setItem('currentUser', JSON.stringify(user))
      return { success: true }
    }
    
    return { success: false, error: 'Invalid email or password' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}