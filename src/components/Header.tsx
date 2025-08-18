// src/components/ui/Header.tsx
import { Link, NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export function Header() {
  const { pathname } = useLocation()

  return (
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
          <NavItem to="/" label="Home" active={pathname === "/"} />
          <NavItem to="/recent" label="Recent" active={pathname.startsWith("/recent")} />
          <NavItem to="/admin/labels" label="Admin" active={pathname.startsWith("/admin")} />
        </nav>

        {/* Actions (optional auth routes you already have) */}
        <div className="hidden sm:flex items-center gap-2">
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
        </div>
      </div>
    </header>
  )
}

/* -------- small helper -------- */
function NavItem({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <NavLink
      to={to}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm border transition-colors",
        active ? "bg-rose-100 border-rose-200 text-[#7a1d27]" : "hover:bg-muted"
      )}
    >
      {label}
    </NavLink>
  )
}
