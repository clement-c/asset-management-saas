interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </header>
  )
}
