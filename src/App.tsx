// src/App.tsx
import type { ReactElement } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import Index from "@/pages/Index"
import Auth from "@/pages/Auth"
import AdminLabels from "@/pages/AdminLabels"
import AccessDenied from "@/pages/AccessDenied"
import NotFound from "@/pages/NotFound"
import RecentActivity from "@/pages/RecentActivity"   // ⬅️ make sure this file exists & default-exports

import { useAuth } from "@/contexts/AuthContext"

// Admin-only guard
function RequireAdmin({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (user.role !== "admin") return <Navigate to="/access-denied" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />

      {/* New: Recent Activity route */}
      <Route path="/recent" element={<RecentActivity />} />

      {/* Auth */}
      <Route path="/auth" element={<Auth />} />

      {/* Admin */}
      <Route
        path="/admin/labels"
        element={
          <RequireAdmin>
            <AdminLabels />
          </RequireAdmin>
        }
      />

      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
