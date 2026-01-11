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
  onHome: () => void
  onSearch: () => void
  onAddSong: () => void
  onAddSetlist: () => void
  onEdit?: () => void
  setlistNav?: SetlistNavProps
  bpm?: number | null
  originalKey?: string | null
}

export function Layout({
  children,
  title,
  subtitle,
  onHome,
  onSearch,
  onAddSong,
  onAddSetlist,
  onEdit,
  setlistNav,
  bpm,
  originalKey,
}: LayoutProps) {
  return (
    <div className="h-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden">
      <TopBar
        title={title}
        subtitle={subtitle}
        onHome={onHome}
        onSearch={onSearch}
        onAddSong={onAddSong}
        onAddSetlist={onAddSetlist}
        onEdit={onEdit}
        setlistNav={setlistNav}
        bpm={bpm}
        originalKey={originalKey}
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
}

export function ControlButton({ onClick, title, active, variant = 'default', disabled, children }: ControlButtonProps) {
  const baseClasses = "w-10 h-10 flex items-center justify-center rounded-lg transition-colors"

  const variantClasses = {
    default: active
      ? "bg-neutral-700 text-white"
      : "hover:bg-neutral-700 text-neutral-400 hover:text-white",
    primary: "hover:bg-neutral-700 text-amber-500 hover:text-amber-400",
    danger: "bg-red-900 hover:bg-red-800 text-white",
  }

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )
}
