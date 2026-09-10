import { NavLink, Outlet } from "react-router-dom"
import { Boxes, FolderKanban, Package, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const navigation = [
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/people", label: "People", icon: Users },
  { to: "/tasks", label: "Tasks & Deliverables", icon: Boxes },
  { to: "/assets", label: "Assets", icon: Package },
]

export function AppShell() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="border-r bg-slate-950 px-6 py-8 text-slate-50">
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
      </aside>
      <main className="bg-slate-50 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
