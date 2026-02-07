import type { ReactNode } from 'react'

interface TestListItemProps {
  title: string
  subtitle?: string
  right?: ReactNode
  onClick: () => void
}

export default function TestListItem({ title, subtitle, right, onClick }: TestListItemProps) {
  return (
    <button
      onClick={onClick}
      className="rl-card rl-card-hover w-full text-left p-6 flex items-start justify-between gap-4"
    >
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </button>
  )
}
