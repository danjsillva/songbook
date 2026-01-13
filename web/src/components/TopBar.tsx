import { useState } from 'react'
import { Link } from 'wouter'
import { useClickOutside } from '../hooks/useClickOutside'
import { useAuth } from '../contexts/AuthContext'

const Icons = {
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  add: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
  arrowLeft: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

interface SetlistNavProps {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  canGoPrev: boolean
  canGoNext: boolean
}

interface TopBarProps {
  title: string
  subtitle?: string
  onSearch: () => void
  onAddSong: () => void
  onAddSetlist: () => void
  onEdit?: () => void
  setlistNav?: SetlistNavProps
  bpm?: number | null
  originalKey?: string | null
  actions?: React.ReactNode
}

export function TopBar({
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
}: TopBarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const addMenuRef = useClickOutside<HTMLDivElement>(() => setShowAddMenu(false), showAddMenu)
  const userMenuRef = useClickOutside<HTMLDivElement>(() => setShowUserMenu(false), showUserMenu)
  const mobileMenuRef = useClickOutside<HTMLDivElement>(() => setShowMobileMenu(false), showMobileMenu)
  const { user, loading, signIn, signOut } = useAuth()

  return (
    <header className="h-12 bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 relative flex items-center">
      {/* Logo - posicao fixa esquerda */}
      <div className="absolute left-4">
        <Link
          href="/"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Inicio"
        >
          <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </Link>
      </div>

      {/* Container centralizado - alinhado com conteudo principal */}
      <div className="w-full px-14 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center min-w-0">
          {/* Navegacao Setlist - alinhada a direita do seu espaco (hidden on mobile) */}
          <div className="hidden lg:flex w-32 -ml-32 justify-end pr-5 flex-shrink-0">
            {setlistNav && (
              <div className="flex items-center gap-1">
                <button
                  onClick={setlistNav.onPrev}
                  disabled={!setlistNav.canGoPrev}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Musica anterior"
                >
                  {Icons.arrowLeft}
                </button>
                <span className="text-neutral-400 text-sm font-medium min-w-[3rem] text-center">
                  {setlistNav.current}/{setlistNav.total}
                </span>
                <button
                  onClick={setlistNav.onNext}
                  disabled={!setlistNav.canGoNext}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Proxima musica"
                >
                  {Icons.arrowRight}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {/* Linha 1: Titulo + subtitulo (desktop) + edit */}
            <div className="flex items-baseline gap-3 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-neutral-100 truncate">
                {title}
              </h1>
              {subtitle && (
                <span className="text-base text-neutral-500 truncate hidden sm:block">
                  {subtitle}
                </span>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                  title="Editar"
                >
                  {Icons.edit}
                </button>
              )}
              {/* Badges - desktop */}
              {(bpm || originalKey) && (
                <div className="hidden sm:flex items-center gap-2 ml-auto flex-shrink-0">
                  {bpm && (
                    <span className="px-2.5 py-0.5 bg-neutral-800 text-neutral-300 rounded-full text-sm font-mono">
                      {bpm}bpm
                    </span>
                  )}
                  {originalKey && (
                    <span className="px-2.5 py-0.5 bg-amber-900/50 text-amber-400 rounded-full text-sm font-mono font-bold">
                      {originalKey}
                    </span>
                  )}
                </div>
              )}
              {/* Actions customizadas - desktop */}
              {actions && (
                <div className={`hidden sm:flex items-center gap-2 flex-shrink-0 ${!(bpm || originalKey) ? 'ml-auto' : ''}`}>
                  {actions}
                </div>
              )}
            </div>
            {/* Linha 2: Subtitulo + badges (mobile) */}
            {(subtitle || bpm || originalKey) && (
              <div className="flex items-center gap-1 sm:hidden">
                {subtitle && (
                  <span className="text-xs text-neutral-500 truncate">{subtitle}</span>
                )}
                <div className="flex gap-1 ml-auto flex-shrink-0">
                  {originalKey && (
                    <span className="px-1.5 py-0.5 bg-amber-900/50 text-amber-400 rounded-full text-xs font-mono">
                      {originalKey}
                    </span>
                  )}
                  {bpm && (
                    <span className="px-1.5 py-0.5 bg-neutral-700 text-neutral-300 rounded-full text-xs font-mono">
                      {bpm}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acoes Desktop - posicao fixa direita */}
      <div className="absolute right-4 hidden sm:flex items-center gap-1">
        {/* Botao Adicionar */}
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-800 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
            title="Adicionar"
          >
            {Icons.add}
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 bg-neutral-800 rounded-xl shadow-lg py-2 min-w-[180px] z-50 border border-neutral-700">
              <button
                onClick={() => { setShowAddMenu(false); onAddSong() }}
                className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-3"
              >
                {Icons.music}
                Nova Musica
              </button>
              <button
                onClick={() => { setShowAddMenu(false); onAddSetlist() }}
                className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-3"
              >
                {Icons.setlist}
                Novo Setlist
              </button>
            </div>
          )}
        </div>

        {/* Botao Buscar */}
        <button
          onClick={onSearch}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Buscar (/)"
        >
          {Icons.search}
        </button>

        {/* Avatar / Login */}
        <div className="relative" ref={userMenuRef}>
          {loading ? (
            <div className="w-9 h-9 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin" />
            </div>
          ) : user ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors cursor-pointer overflow-hidden"
                title={user.displayName || 'Perfil'}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-medium">
                    {user.displayName?.[0] || user.email?.[0] || '?'}
                  </div>
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-neutral-800 rounded-xl shadow-lg py-2 min-w-[180px] z-50 border border-neutral-700">
                  <div className="px-4 py-2 border-b border-neutral-700">
                    <p className="text-sm font-medium text-neutral-100 truncate">{user.displayName}</p>
                    <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); signOut() }}
                    className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer text-red-400"
                  >
                    Sair
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={signIn}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Entrar com Google"
            >
              {Icons.user}
            </button>
          )}
        </div>
      </div>

      {/* Menu Mobile - posicao fixa direita */}
      <div className="absolute right-4 sm:hidden" ref={mobileMenuRef}>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Menu"
        >
          {Icons.menu}
        </button>
        {showMobileMenu && (
          <div className="absolute right-0 top-full mt-1 bg-neutral-800 rounded-xl shadow-lg py-2 min-w-[200px] z-50 border border-neutral-700">
            <button
              onClick={() => { setShowMobileMenu(false); onSearch() }}
              className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-3"
            >
              {Icons.search}
              Buscar
            </button>
            <button
              onClick={() => { setShowMobileMenu(false); onAddSong() }}
              className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-3"
            >
              {Icons.music}
              Nova Musica
            </button>
            <button
              onClick={() => { setShowMobileMenu(false); onAddSetlist() }}
              className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-3"
            >
              {Icons.setlist}
              Novo Setlist
            </button>
            <div className="border-t border-neutral-700 my-1" />
            {loading ? (
              <div className="px-4 py-2.5 flex items-center gap-3 text-sm text-neutral-400">
                <div className="w-5 h-5 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin" />
                Carregando...
              </div>
            ) : user ? (
              <>
                <div className="px-4 py-2 flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-medium">
                      {user.displayName?.[0] || user.email?.[0] || '?'}
                    </div>
                  )}
                  <span className="text-sm text-neutral-300 truncate">{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={() => { setShowMobileMenu(false); signOut() }}
                  className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-3 text-red-400"
                >
                  {Icons.logout}
                  Sair
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowMobileMenu(false); signIn() }}
                className="w-full px-4 py-2.5 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-3"
              >
                {Icons.user}
                Entrar com Google
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
