// src/App.tsx
import type { ReactElement } from "react";
import { Routes, Route, Navigate, Link, NavLink, Outlet } from "react-router-dom";

import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import AdminLabels from "@/pages/AdminLabels";
import AccessDenied from "@/pages/AccessDenied";
import NotFound from "@/pages/NotFound";
import RecentActivity from "@/pages/RecentActivity";

import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/api"; // server-side logout

/* -------- Admin-only guard -------- */
function RequireAdmin({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "admin") return <Navigate to="/access-denied" replace />;
  return children;
}

/* -------- Single global layout with header -------- */
function Layout() {
  const auth = useAuth();
  const user = auth.user;

  async function handleSignOut() {
    try {
      await logout(); // clear server session/cookie
    } catch {
      // ignore errors; still clear local state
    } finally {
      auth.logout();
      auth.setUser(null);
      localStorage.removeItem("role");
      window.location.href = "/auth"; // clean redirect
    }
  }

  return (
    <div className="min-h-screen bg-[#f1d8cf]">
      {/* Global Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7a1d27] to-[#d36a76] flex items-center justify-center text-white font-bold">
              FG
            </div>
            <span className="font-semibold text-[#3e0e12]">FraudGuard</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            <Nav to="/" end>Home</Nav>
            <Nav to="/recent">Recent</Nav>
            <Nav to="/admin/labels">Admin</Nav>
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-[#3e0e12]/70">
                  Hi, {user.name ?? user.email ?? "admin"}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm hover:opacity-90"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="px-3 py-1.5 rounded-md border hover:bg-muted text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/admin/labels"
                  className="px-3 py-1.5 rounded-md bg-[#7a1d27] text-white text-sm hover:opacity-90"
                >
                  Admin Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page outlet */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

/* Small NavLink helper */
function Nav({ to, end = false, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "px-3 py-1.5 rounded-md text-sm border transition-colors",
          isActive ? "bg-rose-100 border-rose-200 text-[#7a1d27]" : "hover:bg-muted",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

/* -------- Router -------- */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Home */}
        <Route index element={<Index />} />

        {/* Public */}
        <Route path="recent" element={<RecentActivity />} />
        <Route path="auth" element={<Auth />} />

        {/* Admin */}
        <Route
          path="admin/labels"
          element={
            <RequireAdmin>
              <AdminLabels />
            </RequireAdmin>
          }
        />
        <Route path="admin" element={<Navigate to="/admin/labels" replace />} />

        {/* Access + 404 */}
        <Route path="access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
