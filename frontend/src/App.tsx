import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom"

import { AppShell } from "@/components/layout/app-shell"
import { AssetsPage } from "@/pages/assets-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { PeoplePage } from "@/pages/people-page"
import { ProjectsPage } from "@/pages/projects-page"
import { TasksPage } from "@/pages/tasks-page"

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "people", element: <PeoplePage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "assets", element: <AssetsPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
