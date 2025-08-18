// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Role = "admin" | "user"

export type AuthUser = {
  id: number | string
  email: string
  name?: string
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string, role?: Role) => Promise<void>
  logout: () => void
  setUser: (u: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const LS_KEY = "fraudguard_auth_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // load persisted user
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.email && parsed.role) {
          setUserState(parsed)
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  const setUser = (u: AuthUser | null) => {
    setUserState(u)
    try {
      if (u) localStorage.setItem(LS_KEY, JSON.stringify(u))
      else localStorage.removeItem(LS_KEY)
    } catch {
      /* ignore */
    }
  }

  // Fake login for now (email/password unvalidated; role controls access)
  const login = async (email: string, _password: string, role: Role = "user") => {
    const newUser: AuthUser = {
      id: Date.now(),
      email,
      name: email.split("@")[0] ?? "User",
      role,
    }
    setUser(newUser)
  }

  const logout = () => setUser(null)

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, setUser }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
