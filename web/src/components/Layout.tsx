import { useState, type ReactNode } from 'react'
import { useClickOutside } from '../hooks/useClickOutside'

// Icons
const Icons = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  music: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  setlist: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  add: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  back: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
}

interface LayoutProps {
  children: ReactNode
  onHome: () => void
  onSearchSongs: () => void
  onSearchSetlists: () => void
  onAddSong: () => void
  onAddSetlist: () => void
  pageControls?: ReactNode
  backButton?: {
    onClick: () => void
    title?: string
  }
}

export function Layout({
  children,
  onHome,
  onSearchSongs,
  onSearchSetlists,
  onAddSong,
  onAddSetlist,
  pageControls,
  backButton,
}: LayoutProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useClickOutside<HTMLDivElement>(() => setShowAddMenu(false), showAddMenu)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Sidebar */}
      <aside className="w-16 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-4 gap-2 sticky top-0 h-screen">
        {/* Back button (quando presente) */}
        {backButton && (
          <>
            <SidebarButton onClick={backButton.onClick} title={backButton.title || "Voltar"}>
              {Icons.back}
            </SidebarButton>
            <SidebarDivider />
          </>
        )}

        {/* Navegacao global */}
        <SidebarButton onClick={onHome} title="Inicio">
          {Icons.home}
        </SidebarButton>
        <SidebarButton onClick={onSearchSongs} title="Buscar musica">
          {Icons.music}
        </SidebarButton>
        <SidebarButton onClick={onSearchSetlists} title="Buscar setlist">
          {Icons.setlist}
        </SidebarButton>

        {/* Controles especificos da pagina */}
        {pageControls && (
          <>
            <SidebarDivider />
            {pageControls}
          </>
        )}

        <SidebarSpacer />

        {/* Botao adicionar no bottom */}
        <div className="relative" ref={addMenuRef}>
          <SidebarButton onClick={() => setShowAddMenu(!showAddMenu)} title="Adicionar" variant="primary">
            {Icons.add}
          </SidebarButton>
          {showAddMenu && (
            <div className="absolute left-16 bottom-0 bg-neutral-800 rounded-xl shadow-lg py-2 min-w-[180px] z-50">
              <button onClick={() => { setShowAddMenu(false); onAddSong() }} className="w-full px-5 py-3 text-left hover:bg-neutral-700 text-base cursor-pointer flex items-center gap-3">
                {Icons.music}
                Nova Musica
              </button>
              <button onClick={() => { setShowAddMenu(false); onAddSetlist() }} className="w-full px-5 py-3 text-left hover:bg-neutral-700 text-base cursor-pointer flex items-center gap-3">
                {Icons.setlist}
                Novo Setlist
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}

// Botao padrao da sidebar
interface SidebarButtonProps {
  onClick: () => void
  title: string
  active?: boolean
  variant?: 'default' | 'primary' | 'danger'
  children: ReactNode
}

export function SidebarButton({ onClick, title, active, variant = 'default', children }: SidebarButtonProps) {
  const baseClasses = "w-12 h-12 flex items-center justify-center rounded-xl transition-colors cursor-pointer"

  const variantClasses = {
    default: active
      ? "bg-neutral-700 text-white"
      : "hover:bg-neutral-800 text-neutral-400 hover:text-white",
    primary: "hover:bg-neutral-800 text-amber-500 hover:text-amber-400",
    danger: "bg-red-900 hover:bg-red-800 text-white",
  }

  return (
    <button
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  )
}

// Separador
export function SidebarDivider() {
  return <div className="w-8 border-t border-neutral-700 my-2" />
}

// Spacer para empurrar itens pro final
export function SidebarSpacer() {
  return <div className="flex-1" />
}
