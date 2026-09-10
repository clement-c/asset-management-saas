import { useMutation, useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { KeyRound, Shield } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { FormError } from "@/components/form-error"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import type { Person, Project } from "@/types"

const personSchema = z.object({
  project_id: z.string().optional().transform((val: string | undefined) => (val ? Number(val) : null)),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  role: z.string().optional(),
  password: z.string().optional(),
  is_admin: z.boolean().default(false),
})

type PersonFormValues = z.infer<typeof personSchema>
type PersonFormInput = z.input<typeof personSchema>
type PersonFormOutput = z.output<typeof personSchema>

export function PeoplePage() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get<Project[]>("/projects/")).data,
  })
  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: async () => (await api.get<Person[]>("/people/")).data,
  })

  const form = useForm<PersonFormInput, unknown, PersonFormOutput>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
      password: "",
      is_admin: false,
    },
  })

  const createPerson = useMutation({
    mutationFn: async (values: PersonFormOutput) => (await api.post<Person>("/people/", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] })
      form.reset({
        first_name: "",
        last_name: "",
        email: "",
        role: "",
        password: "",
        is_admin: false,
      })
    },
  })

  const deletePerson = useMutation({
    mutationFn: async (personId: number) => api.delete(`/people/${personId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["people"] }),
  })

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]))

  return (
    <div>
      <PageHeader title="People" description="Manage artists, producers, and reviewers assigned to active productions." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New person</CardTitle>
            <CardDescription>Attach people to projects and set passwords so they can sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createPerson.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="project_id">Project (Optional)</Label>
                <select id="project_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...form.register("project_id")}>
                  <option value="">No specific project (Global / Admin)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <FormError message={form.formState.errors.project_id?.message} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" {...form.register("first_name")} />
                  <FormError message={form.formState.errors.first_name?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" {...form.register("last_name")} />
                  <FormError message={form.formState.errors.last_name?.message} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                <FormError message={form.formState.errors.email?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" placeholder="Lead rigger" {...form.register("role")} />
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <Label htmlFor="password">Password (Optional login password)</Label>
                <Input id="password" type="password" placeholder="Set a password for login" {...form.register("password")} />
                <p className="text-[11px] text-slate-500">Provide a password if this person needs to sign into the SaaS app.</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input id="is_admin" type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("is_admin")} />
                <Label htmlFor="is_admin" className="cursor-pointer text-sm font-medium">Grant System Administrator access</Label>
              </div>

              <Button type="submit" disabled={createPerson.isPending}>
                {createPerson.isPending ? "Creating…" : "Create person"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {people.length === 0 ? (
            <EmptyState message="No people yet. Create a project or person to get started." />
          ) : (
            people.map((person) => (
              <Card key={person.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>
                        {person.first_name} {person.last_name}
                      </CardTitle>
                      {person.is_admin && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      )}
                      {person.has_password && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          <KeyRound className="h-3 w-3" /> Login Enabled
                        </span>
                      )}
                    </div>
                    <CardDescription>{person.role || "No role specified"}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deletePerson.mutate(person.id)}>
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>{person.email}</p>
                  <p>Project: {person.project_id ? projectNameById.get(person.project_id) || "Unknown project" : "Global / System"}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
