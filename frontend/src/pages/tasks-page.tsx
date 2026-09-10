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
import type { Deliverable, Person, Project, Task } from "@/types"

const optionalNumber = z.preprocess((value) => (value === "" || value == null ? undefined : Number(value)), z.number().int().positive().optional())

const taskSchema = z.object({
  project_id: z.coerce.number().int().positive(),
  assignee_id: optionalNumber,
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.string().default("todo"),
  due_date: z.string().optional(),
})

const deliverableSchema = z.object({
  project_id: z.coerce.number().int().positive(),
  task_id: optionalNumber,
  name: z.string().min(1, "Deliverable name is required"),
  description: z.string().optional(),
  status: z.string().default("planned"),
  due_date: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>
type DeliverableFormValues = z.infer<typeof deliverableSchema>
type TaskFormInput = z.input<typeof taskSchema>
type TaskFormOutput = z.output<typeof taskSchema>
type DeliverableFormInput = z.input<typeof deliverableSchema>
type DeliverableFormOutput = z.output<typeof deliverableSchema>

export function TasksPage() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get<Project[]>("/projects/")).data,
  })
  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: async () => (await api.get<Person[]>("/people/")).data,
  })
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await api.get<Task[]>("/tasks/")).data,
  })
  const { data: deliverables = [] } = useQuery({
    queryKey: ["deliverables"],
    queryFn: async () => (await api.get<Deliverable[]>("/deliverables/")).data,
  })

  const taskForm = useForm<TaskFormInput, unknown, TaskFormOutput>({ resolver: zodResolver(taskSchema), defaultValues: { status: "todo" } })
  const deliverableForm = useForm<DeliverableFormInput, unknown, DeliverableFormOutput>({
    resolver: zodResolver(deliverableSchema),
    defaultValues: { status: "planned" },
  })

  const createTask = useMutation({
    mutationFn: async (values: TaskFormOutput) =>
      (await api.post<Task>("/tasks/", { ...values, due_date: values.due_date || null, assignee_id: values.assignee_id ?? null })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      taskForm.reset({ status: "todo" })
    },
  })

  const createDeliverable = useMutation({
    mutationFn: async (values: DeliverableFormOutput) =>
      (await api.post<Deliverable>("/deliverables/", { ...values, due_date: values.due_date || null, task_id: values.task_id ?? null })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] })
      deliverableForm.reset({ status: "planned" })
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })

  const deleteDeliverable = useMutation({
    mutationFn: async (deliverableId: number) => api.delete(`/deliverables/${deliverableId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliverables"] }),
  })

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]))
  const taskNameById = new Map(tasks.map((task) => [task.id, task.title]))
  const personNameById = new Map(people.map((person) => [person.id, `${person.first_name} ${person.last_name}`]))

  return (
    <div>
      <PageHeader title="Tasks & Deliverables" description="Track production execution and the outputs that need to be reviewed or delivered." />
      <div className="grid gap-6 2xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New task</CardTitle>
            <CardDescription>Create work items and optionally assign them to team members.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={taskForm.handleSubmit((values) => createTask.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="task_project_id">Project</Label>
                <select id="task_project_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...taskForm.register("project_id")}>
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <FormError message={taskForm.formState.errors.project_id?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_assignee_id">Assignee</Label>
                <select id="task_assignee_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...taskForm.register("assignee_id")}>
                  <option value="">Unassigned</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.first_name} {person.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...taskForm.register("title")} />
                <FormError message={taskForm.formState.errors.title?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_status">Status</Label>
                <Input id="task_status" {...taskForm.register("status")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_due_date">Due date</Label>
                <Input id="task_due_date" type="date" {...taskForm.register("due_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_description">Description</Label>
                <Textarea id="task_description" {...taskForm.register("description")} />
              </div>
              <Button type="submit" disabled={createTask.isPending || projects.length === 0}>
                {createTask.isPending ? "Creating…" : "Create task"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New deliverable</CardTitle>
            <CardDescription>Attach downstream outputs to projects or specific tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={deliverableForm.handleSubmit((values) => createDeliverable.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="deliverable_project_id">Project</Label>
                <select id="deliverable_project_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...deliverableForm.register("project_id")}>
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <FormError message={deliverableForm.formState.errors.project_id?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverable_task_id">Task</Label>
                <select id="deliverable_task_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...deliverableForm.register("task_id")}>
                  <option value="">No linked task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverable_name">Name</Label>
                <Input id="deliverable_name" {...deliverableForm.register("name")} />
                <FormError message={deliverableForm.formState.errors.name?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverable_status">Status</Label>
                <Input id="deliverable_status" {...deliverableForm.register("status")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverable_due_date">Due date</Label>
                <Input id="deliverable_due_date" type="date" {...deliverableForm.register("due_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverable_description">Description</Label>
                <Textarea id="deliverable_description" {...deliverableForm.register("description")} />
              </div>
              <Button type="submit" disabled={createDeliverable.isPending || projects.length === 0}>
                {createDeliverable.isPending ? "Creating…" : "Create deliverable"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Task backlog</h3>
          {tasks.length === 0 ? (
            <EmptyState message="No tasks yet. Create a project and task to start tracking execution." />
          ) : (
            tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>{projectNameById.get(task.project_id) || "Unknown project"} · {task.status}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteTask.mutate(task.id)}>
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>{task.description || "No description provided."}</p>
                  <p>Assignee: {task.assignee_id ? personNameById.get(task.assignee_id) : "Unassigned"}</p>
                  <p>Due: {task.due_date || "Not set"}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Deliverables</h3>
          {deliverables.length === 0 ? (
            <EmptyState message="No deliverables yet. Use this section to capture outputs and review milestones." />
          ) : (
            deliverables.map((deliverable) => (
              <Card key={deliverable.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{deliverable.name}</CardTitle>
                    <CardDescription>{projectNameById.get(deliverable.project_id) || "Unknown project"} · {deliverable.status}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteDeliverable.mutate(deliverable.id)}>
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>{deliverable.description || "No description provided."}</p>
                  <p>Linked task: {deliverable.task_id ? taskNameById.get(deliverable.task_id) : "Standalone deliverable"}</p>
                  <p>Due: {deliverable.due_date || "Not set"}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
