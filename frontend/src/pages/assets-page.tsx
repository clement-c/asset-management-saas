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
import type { Asset, AssetVault, AssetVersion, Deliverable, Project } from "@/types"

const optionalNumber = z.preprocess((value) => (value === "" || value == null ? undefined : Number(value)), z.number().int().positive().optional())

const vaultSchema = z.object({
  project_id: z.coerce.number().int().positive(),
  name: z.string().min(1, "Vault name is required"),
  description: z.string().optional(),
  storage_prefix: z.string().optional(),
})

const assetSchema = z.object({
  vault_id: z.coerce.number().int().positive(),
  deliverable_id: optionalNumber,
  name: z.string().min(1, "Asset name is required"),
  asset_type: z.string().optional(),
  dcc_software: z.string().optional(),
  asset_metadata: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) {
        return true
      }
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, "Asset metadata must be valid JSON"),
})

const uploadSchema = z.object({
  asset_id: z.coerce.number().int().positive(),
  notes: z.string().optional(),
  file: z.any().refine((value) => value?.length === 1, "A file is required"),
})

type VaultFormValues = z.infer<typeof vaultSchema>
type AssetFormValues = z.infer<typeof assetSchema>
type UploadFormValues = z.infer<typeof uploadSchema>
type VaultFormInput = z.input<typeof vaultSchema>
type VaultFormOutput = z.output<typeof vaultSchema>
type AssetFormInput = z.input<typeof assetSchema>
type AssetFormOutput = z.output<typeof assetSchema>
type UploadFormInput = z.input<typeof uploadSchema>
type UploadFormOutput = z.output<typeof uploadSchema>

export function AssetsPage() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: async () => (await api.get<Project[]>("/projects/")).data })
  const { data: deliverables = [] } = useQuery({
    queryKey: ["deliverables"],
    queryFn: async () => (await api.get<Deliverable[]>("/deliverables/")).data,
  })
  const { data: vaults = [] } = useQuery({ queryKey: ["asset-vaults"], queryFn: async () => (await api.get<AssetVault[]>("/asset-vaults/")).data })
  const { data: assets = [] } = useQuery({ queryKey: ["assets"], queryFn: async () => (await api.get<Asset[]>("/assets/")).data })
  const { data: versions = [] } = useQuery({
    queryKey: ["asset-versions"],
    queryFn: async () => (await api.get<AssetVersion[]>("/asset-versions/")).data,
  })

  const vaultForm = useForm<VaultFormInput, unknown, VaultFormOutput>({ resolver: zodResolver(vaultSchema) })
  const assetForm = useForm<AssetFormInput, unknown, AssetFormOutput>({ resolver: zodResolver(assetSchema) })
  const uploadForm = useForm<UploadFormInput, unknown, UploadFormOutput>({ resolver: zodResolver(uploadSchema) })

  const createVault = useMutation({
    mutationFn: async (values: VaultFormOutput) => (await api.post<AssetVault>("/asset-vaults/", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-vaults"] })
      vaultForm.reset()
    },
  })

  const createAsset = useMutation({
    mutationFn: async (values: AssetFormOutput) =>
      (await api.post<Asset>("/assets/", {
        ...values,
        deliverable_id: values.deliverable_id ?? null,
        asset_metadata: values.asset_metadata ? JSON.parse(values.asset_metadata) : null,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      assetForm.reset()
    },
  })

  const uploadAsset = useMutation({
    mutationFn: async (values: UploadFormOutput) => {
      const file = values.file?.[0]
      const formData = new FormData()
      formData.append("file", file)
      if (values.notes) {
        formData.append("notes", values.notes)
      }
      return (await api.post<AssetVersion>(`/assets/${values.asset_id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["asset-versions"] })
      uploadForm.reset()
    },
  })

  const deleteVault = useMutation({
    mutationFn: async (vaultId: number) => api.delete(`/asset-vaults/${vaultId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-vaults"] }),
  })

  const deleteAsset = useMutation({
    mutationFn: async (assetId: number) => api.delete(`/assets/${assetId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  })

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]))
  const deliverableNameById = new Map(deliverables.map((deliverable) => [deliverable.id, deliverable.name]))
  const assetNameById = new Map(assets.map((asset) => [asset.id, asset.name]))

  return (
    <div>
      <PageHeader title="Assets" description="Create vaults, register assets, and upload versioned files to object storage." />
      <div className="grid gap-6 2xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>New asset vault</CardTitle>
            <CardDescription>Provision a logical storage namespace per project or pipeline stage.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={vaultForm.handleSubmit((values) => createVault.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="vault_project_id">Project</Label>
                <select id="vault_project_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...vaultForm.register("project_id")}>
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <FormError message={vaultForm.formState.errors.project_id?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault_name">Vault name</Label>
                <Input id="vault_name" {...vaultForm.register("name")} />
                <FormError message={vaultForm.formState.errors.name?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_prefix">Storage prefix</Label>
                <Input id="storage_prefix" placeholder="characters/main" {...vaultForm.register("storage_prefix")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vault_description">Description</Label>
                <Textarea id="vault_description" {...vaultForm.register("description")} />
              </div>
              <Button type="submit" disabled={createVault.isPending || projects.length === 0}>
                {createVault.isPending ? "Creating…" : "Create vault"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New asset</CardTitle>
            <CardDescription>Track the logical asset independently from the files uploaded for each version.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={assetForm.handleSubmit((values) => createAsset.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="asset_vault_id">Vault</Label>
                <select id="asset_vault_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...assetForm.register("vault_id")}>
                  <option value="">Select a vault</option>
                  {vaults.map((vault) => (
                    <option key={vault.id} value={vault.id}>
                      {vault.name}
                    </option>
                  ))}
                </select>
                <FormError message={assetForm.formState.errors.vault_id?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset_deliverable_id">Deliverable</Label>
                <select id="asset_deliverable_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...assetForm.register("deliverable_id")}>
                  <option value="">No linked deliverable</option>
                  {deliverables.map((deliverable) => (
                    <option key={deliverable.id} value={deliverable.id}>
                      {deliverable.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset_name">Asset name</Label>
                <Input id="asset_name" {...assetForm.register("name")} />
                <FormError message={assetForm.formState.errors.name?.message} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset_type">Asset type</Label>
                  <Input id="asset_type" placeholder="model" {...assetForm.register("asset_type")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dcc_software">DCC software</Label>
                  <Input id="dcc_software" placeholder="maya" {...assetForm.register("dcc_software")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset_metadata">Asset metadata (JSON)</Label>
                <Textarea id="asset_metadata" placeholder='{"lod": "high"}' {...assetForm.register("asset_metadata")} />
                <FormError message={assetForm.formState.errors.asset_metadata?.message} />
              </div>
              <Button type="submit" disabled={createAsset.isPending || vaults.length === 0}>
                {createAsset.isPending ? "Creating…" : "Create asset"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload asset version</CardTitle>
            <CardDescription>Push binary files to MinIO and register a new asset version in the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={uploadForm.handleSubmit((values) => uploadAsset.mutate(values))}>
              <div className="space-y-2">
                <Label htmlFor="upload_asset_id">Asset</Label>
                <select id="upload_asset_id" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" {...uploadForm.register("asset_id")}>
                  <option value="">Select an asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
                <FormError message={uploadForm.formState.errors.asset_id?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" {...uploadForm.register("file", { required: true })} />
                <FormError message={uploadForm.formState.errors.file?.message?.toString()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload_notes">Notes</Label>
                <Textarea id="upload_notes" {...uploadForm.register("notes")} />
              </div>
              <Button type="submit" disabled={uploadAsset.isPending || assets.length === 0}>
                {uploadAsset.isPending ? "Uploading…" : "Upload version"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Vaults & assets</h3>
          {vaults.length === 0 ? (
            <EmptyState message="No vaults yet. Create a project and add a vault before registering assets." />
          ) : (
            vaults.map((vault) => (
              <Card key={vault.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{vault.name}</CardTitle>
                    <CardDescription>{projectNameById.get(vault.project_id) || "Unknown project"}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteVault.mutate(vault.id)}>
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <p>{vault.description || "No description provided."}</p>
                  <p>Prefix: {vault.storage_prefix || "(derived from asset IDs)"}</p>
                  <div className="space-y-2">
                    {assets.filter((asset) => asset.vault_id === vault.id).map((asset) => (
                      <div key={asset.id} className="rounded-lg border bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-900">{asset.name}</p>
                            <p>{asset.asset_type || "Unspecified type"} · {asset.dcc_software || "Unspecified DCC"}</p>
                            <p>Version: v{asset.current_version}</p>
                            <p>Deliverable: {asset.deliverable_id ? deliverableNameById.get(asset.deliverable_id) : "None"}</p>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => deleteAsset.mutate(asset.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {assets.every((asset) => asset.vault_id !== vault.id) && <p>No assets in this vault yet.</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recent asset versions</h3>
          {versions.length === 0 ? (
            <EmptyState message="No uploaded versions yet. Upload a file to create the first revision." />
          ) : (
            versions.map((version) => (
              <Card key={version.id}>
                <CardHeader>
                  <CardTitle>{assetNameById.get(version.asset_id) || "Unknown asset"}</CardTitle>
                  <CardDescription>v{version.version_number} · {version.file_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>Size: {version.file_size} bytes</p>
                  <p>Object key: {version.object_key}</p>
                  <p>Notes: {version.notes || "No notes provided."}</p>
                  <a
                    className="inline-flex text-primary underline-offset-4 hover:underline"
                    href={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"}/asset-versions/${version.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download file
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
