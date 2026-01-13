import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

interface SetlistNavProps {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  canGoPrev: boolean
  canGoNext: boolean
}

interface LayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  onSearch: () => void
  onAddSong: () => void
  onAddSetlist: () => void
  onEdit?: () => void
  setlistNav?: SetlistNavProps
  bpm?: number | null
  originalKey?: string | null
  actions?: ReactNode
}

export function Layout({
  children,
  title,
  subtitle,
  onSearch,
  onAddSong,
  onAddSetlist,
  onEdit,
  setlistNav,
  bpm,
  originalKey,
  actions,
}: LayoutProps) {
  return (
    <div className="h-screen bg-bg-primary text-text-primary flex flex-col overflow-hidden">
      <TopBar
        title={title}
        subtitle={subtitle}
        onSearch={onSearch}
        onAddSong={onAddSong}
        onAddSetlist={onAddSetlist}
        onEdit={onEdit}
        setlistNav={setlistNav}
        bpm={bpm}
        originalKey={originalKey}
        actions={actions}
      />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        {children}
      </main>
    </div>
  )
}

// Componentes auxiliares para uso em FloatingControls e outros lugares
interface ControlButtonProps {
  onClick: () => void
  title: string
  active?: boolean
  variant?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function ControlButton({
  onClick,
  title,
  active,
  variant = 'default',
  disabled,
  children,
  size = 'md'
}: ControlButtonProps) {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }

  const baseClasses = `
    ${sizeClasses[size]}
    flex items-center justify-center
    rounded-full
    transition-all duration-200 ease-out
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
  `

  const variantClasses = {
    default: active
      ? 'bg-surface-active text-text-primary shadow-sm'
      : 'bg-surface/50 hover:bg-surface-hover text-text-secondary hover:text-text-primary',
    primary: 'bg-accent/10 hover:bg-accent/20 text-accent hover:text-accent-hover',
    danger: 'bg-danger-subtle hover:bg-danger-muted text-danger',
  }

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )
}

// Badge component for consistent styling
interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'accent' | 'teal'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  const variantClasses = {
    default: 'bg-surface text-text-secondary',
    accent: 'bg-accent-subtle text-accent',
    teal: 'bg-teal-subtle text-teal',
  }

  return (
    <span className={`
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      rounded-full font-mono font-medium
      inline-flex items-center
    `}>
      {children}
    </span>
  )
}
