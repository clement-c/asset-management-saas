export interface Project {
  id: number
  name: string
  code?: string | null
  description?: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Person {
  id: number
  project_id: number
  first_name: string
  last_name: string
  email: string
  role?: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  project_id: number
  assignee_id?: number | null
  title: string
  description?: string | null
  status: string
  due_date?: string | null
  created_at: string
  updated_at: string
}

export interface Deliverable {
  id: number
  project_id: number
  task_id?: number | null
  name: string
  description?: string | null
  status: string
  due_date?: string | null
  created_at: string
  updated_at: string
}

export interface AssetVault {
  id: number
  project_id: number
  name: string
  description?: string | null
  storage_prefix?: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: number
  vault_id: number
  deliverable_id?: number | null
  name: string
  asset_type?: string | null
  dcc_software?: string | null
  asset_metadata?: Record<string, unknown> | null
  current_version: number
  latest_file_name?: string | null
  latest_object_key?: string | null
  created_at: string
  updated_at: string
}

export interface AssetVersion {
  id: number
  asset_id: number
  version_number: number
  file_name: string
  object_key: string
  content_type?: string | null
  file_size: number
  notes?: string | null
  created_at: string
  updated_at: string
}
