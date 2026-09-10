import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-slate-600">The page you requested does not exist in this starter dashboard.</p>
      <Button asChild>
        <Link to="/projects">Back to dashboard</Link>
      </Button>
    </div>
  )
}
