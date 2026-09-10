import { useMutation, useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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
  project_id: z.coerce.number().int().positive(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  role: z.string().optional(),
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
  })

  const createPerson = useMutation({
    mutationFn: async (values: PersonFormOutput) => (await api.post<Person>("/people/", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] })
      form.reset()
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
            <CardDescription>Attach people to projects so tasks can be assigned with context.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createPerson.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="project_id">Project</Label>
                <select id="project_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...form.register("project_id")}>
                  <option value="">Select a project</option>
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
              <Button type="submit" disabled={createPerson.isPending || projects.length === 0}>
                {createPerson.isPending ? "Creating…" : "Create person"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {people.length === 0 ? (
            <EmptyState message="No people yet. Create a project first, then add team members." />
          ) : (
            people.map((person) => (
              <Card key={person.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>
                      {person.first_name} {person.last_name}
                    </CardTitle>
                    <CardDescription>{person.role || "No role specified"}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deletePerson.mutate(person.id)}>
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>{person.email}</p>
                  <p>Project: {projectNameById.get(person.project_id) || "Unknown project"}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
