import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { KeyRound, ShieldAlert } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      await login(values.email, values.password)
      navigate("/projects", { replace: true })
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { detail?: string } } }).response
        setErrorMessage(response?.data?.detail || "Invalid email or password")
      } else {
        setErrorMessage("Unable to connect to login server")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-100">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">Asset SaaS Login</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in with your Person account to access workspace</p>
        </div>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription className="text-slate-400">Enter your credentials below</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-md bg-red-950/80 p-3 text-sm text-red-200 border border-red-800">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500"
                  {...form.register("email")}
                />
                <FormError message={form.formState.errors.email?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500"
                  {...form.register("password")}
                />
                <FormError message={form.formState.errors.password?.message} />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Default Admin Credentials:</p>
          <p className="mt-1 font-mono text-slate-300">Email: <span className="text-slate-100">admin@example.com</span></p>
          <p className="font-mono text-slate-300">Password: <span className="text-slate-100">admin123</span></p>
        </div>
      </div>
    </div>
  )
}
