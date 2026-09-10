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
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import type { Project } from "@/types"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default("active"),
})

type ProjectFormValues = z.infer<typeof projectSchema>
type ProjectFormInput = z.input<typeof projectSchema>
type ProjectFormOutput = z.output<typeof projectSchema>

export function ProjectsPage() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get<Project[]>("/projects/")).data,
  })

  const form = useForm<ProjectFormInput, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { status: "active" },
  })

  const createProject = useMutation({
    mutationFn: async (values: ProjectFormOutput) => (await api.post<Project>("/projects/", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      form.reset({ status: "active", name: "", code: "", description: "" })
    },
  })

  const deleteProject = useMutation({
    mutationFn: async (projectId: number) => api.delete(`/projects/${projectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  })

  return (
    <div>
      <PageHeader title="Projects" description="Create and organize production workspaces for teams, tasks, and asset vaults." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New project!</CardTitle>
            <CardDescription>Seed the platform with the productions you want to track.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createProject.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
                <FormError message={form.formState.errors.name?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="SHOW01" {...form.register("code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" {...form.register("status")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register("description")} />
              </div>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating…" : "Create project"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {projects.length === 0 ? (
            <EmptyState message="No projects yet. Create your first production workspace." />
          ) : (
            projects.map((project) => (
              <Card key={project.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.code || "No project code"} · {project.status}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteProject.mutate(project.id)}>
                    Delete
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{project.description || "No description provided."}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
