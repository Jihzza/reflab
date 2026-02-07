import type { ReactNode } from 'react'

type Variant = 'primary' | 'danger' | 'secondary'

interface DialogAction {
  label: string
  onClick: () => void
  variant?: Variant
  disabled?: boolean
}

interface DialogProps {
  open: boolean
  title: string
  description?: string
  actions: DialogAction[]
  onClose?: () => void
  children?: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'rl-btn rl-btn-primary',
  danger: 'rl-btn rl-btn-danger',
  secondary: 'rl-btn rl-btn-secondary',
}

export default function Dialog({
  open,
  title,
  description,
  actions,
  onClose,
  children,
}: DialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => onClose?.()}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md rl-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="rl-h3">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex gap-3 justify-end">
          {actions.map((action) => {
            const variant: Variant = action.variant ?? 'secondary'
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                className={[
                  variantClass[variant],
                  action.disabled ? 'opacity-60 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {action.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
