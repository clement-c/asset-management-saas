import { NavLink, Outlet } from "react-router-dom"
import { Boxes, FolderKanban, LogOut, Package, Shield, User, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const navigation = [
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/people", label: "People", icon: Users },
  { to: "/tasks", label: "Tasks & Deliverables", icon: Boxes },
  { to: "/assets", label: "Assets", icon: Package },
]

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col justify-between border-r bg-slate-950 px-6 py-8 text-slate-50">
        <div>
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Starter</p>
            <h1 className="mt-2 text-2xl font-semibold">Asset SaaS</h1>
            <p className="mt-2 text-sm text-slate-300">FastAPI + React boilerplate for project, task, and asset tracking.</p>
          </div>
          <nav className="space-y-2">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-800",
                    isActive && "bg-slate-800 text-white",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {user && (
          <div className="mt-8 border-t border-slate-800 pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                {user.is_admin ? <Shield className="h-4 w-4 text-amber-400" /> : <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden text-xs">
                <p className="truncate font-medium text-slate-200">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-slate-400">{user.email}</p>
                {user.is_admin && <span className="inline-block mt-0.5 rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-800">Admin</span>}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start gap-2 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        )}
      </aside>
      <main className="bg-slate-50 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
