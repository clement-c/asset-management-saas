interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-slate-500">{message}</p>
}
