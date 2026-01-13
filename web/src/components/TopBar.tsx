import { useState } from 'react'
import { Link } from 'wouter'
import {
  Search,
  Plus,
  User,
  Pencil,
  Music,
  ListMusic,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
} from 'lucide-react'
import { useClickOutside } from '../hooks/useClickOutside'
import { useAuth } from '../contexts/AuthContext'
import { Badge } from './Layout'

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
    <header className="h-14 bg-bg-secondary/80 backdrop-blur-lg border-b border-border-subtle sticky top-0 z-50 relative flex items-center">
      {/* Logo - Fixed left position */}
      <div className="absolute left-4 lg:left-6">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-hover transition-all duration-200 cursor-pointer group"
          title="Inicio"
        >
          <Music className="w-5 h-5 text-accent group-hover:scale-110 transition-transform duration-200" />
        </Link>
      </div>

      {/* Centered container - aligned with main content */}
      <div className="w-full px-16 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center min-w-0">
          {/* Setlist Navigation - Left aligned (hidden on mobile) */}
          <div className="hidden lg:flex w-36 -ml-36 justify-end pr-6 flex-shrink-0">
            {setlistNav && (
              <div className="flex items-center gap-1">
                <button
                  onClick={setlistNav.onPrev}
                  disabled={!setlistNav.canGoPrev}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                  title="Musica anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-text-secondary text-sm font-medium min-w-[3.5rem] text-center tabular-nums">
                  {setlistNav.current} / {setlistNav.total}
                </span>
                <button
                  onClick={setlistNav.onNext}
                  disabled={!setlistNav.canGoNext}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                  title="Proxima musica"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Title section */}
          <div className="flex flex-col min-w-0 flex-1">
            {/* Row 1: Title + subtitle (desktop) + edit */}
            <div className="flex items-baseline gap-3 min-w-0">
              <h1 className="text-lg font-bold text-text-primary truncate tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <span className="text-sm text-text-tertiary truncate hidden sm:block">
                  {subtitle}
                </span>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-secondary transition-all duration-200 cursor-pointer"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Badges - Desktop */}
              {(bpm || originalKey) && (
                <div className="hidden sm:flex items-center gap-2 ml-auto flex-shrink-0">
                  {bpm && <Badge size="sm">{bpm} bpm</Badge>}
                  {originalKey && <Badge variant="accent" size="sm">{originalKey}</Badge>}
                </div>
              )}

              {/* Custom actions - Desktop */}
              {actions && (
                <div className={`hidden sm:flex items-center gap-2 flex-shrink-0 ${!(bpm || originalKey) ? 'ml-auto' : ''}`}>
                  {actions}
                </div>
              )}
            </div>

            {/* Row 2: Subtitle + badges (mobile) */}
            {(subtitle || bpm || originalKey) && (
              <div className="flex items-center gap-2 sm:hidden">
                {subtitle && (
                  <span className="text-xs text-text-tertiary truncate">{subtitle}</span>
                )}
                <div className="flex gap-1.5 ml-auto flex-shrink-0">
                  {bpm && <Badge size="sm">{bpm}</Badge>}
                  {originalKey && <Badge variant="accent" size="sm">{originalKey}</Badge>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Actions - Fixed right position */}
      <div className="absolute right-4 lg:right-6 hidden sm:flex items-center gap-1">
        {/* Add Button */}
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-hover text-accent hover:text-accent-hover transition-all duration-200 cursor-pointer"
            title="Adicionar"
          >
            <Plus className="w-5 h-5" />
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 bg-bg-elevated border border-border rounded-xl shadow-lg py-2 min-w-[200px] z-50 animate-scale-in">
              <button
                onClick={() => { setShowAddMenu(false); onAddSong() }}
                className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer flex items-center gap-3 transition-colors duration-150"
              >
                <Music className="w-4 h-4 text-text-tertiary" />
                <span>Nova Musica</span>
              </button>
              <button
                onClick={() => { setShowAddMenu(false); onAddSetlist() }}
                className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer flex items-center gap-3 transition-colors duration-150"
              >
                <ListMusic className="w-4 h-4 text-text-tertiary" />
                <span>Novo Setlist</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={onSearch}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
          title="Buscar (/)"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Avatar / Login */}
        <div className="relative" ref={userMenuRef}>
          {loading ? (
            <div className="w-10 h-10 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border border-t-text-secondary rounded-full animate-spin" />
            </div>
          ) : user ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-hover transition-all duration-200 cursor-pointer overflow-hidden"
                title={user.displayName || 'Perfil'}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-bg-primary text-sm font-semibold">
                    {user.displayName?.[0] || user.email?.[0] || '?'}
                  </div>
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 bg-bg-elevated border border-border rounded-xl shadow-lg py-2 min-w-[220px] z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); signOut() }}
                    className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer text-danger flex items-center gap-3 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={signIn}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
              title="Entrar com Google"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Fixed right position */}
      <div className="absolute right-4 sm:hidden" ref={mobileMenuRef}>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {showMobileMenu && (
          <div className="absolute right-0 top-full mt-2 bg-bg-elevated border border-border rounded-xl shadow-lg py-2 min-w-[220px] z-50 animate-scale-in">
            <button
              onClick={() => { setShowMobileMenu(false); onSearch() }}
              className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer flex items-center gap-3 transition-colors duration-150"
            >
              <Search className="w-4 h-4 text-text-tertiary" />
              <span>Buscar</span>
            </button>
            <button
              onClick={() => { setShowMobileMenu(false); onAddSong() }}
              className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer flex items-center gap-3 transition-colors duration-150"
            >
              <Music className="w-4 h-4 text-text-tertiary" />
              <span>Nova Musica</span>
            </button>
            <button
              onClick={() => { setShowMobileMenu(false); onAddSetlist() }}
              className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer flex items-center gap-3 transition-colors duration-150"
            >
              <ListMusic className="w-4 h-4 text-text-tertiary" />
              <span>Novo Setlist</span>
            </button>

            <div className="border-t border-border-subtle my-2" />

            {loading ? (
              <div className="px-4 py-3 flex items-center gap-3 text-sm text-text-tertiary">
                <div className="w-4 h-4 border-2 border-border border-t-text-secondary rounded-full animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : user ? (
              <>
                <div className="px-4 py-3 flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-7 h-7 rounded-lg object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-bg-primary text-xs font-semibold">
                      {user.displayName?.[0] || user.email?.[0] || '?'}
                    </div>
                  )}
                  <span className="text-sm text-text-secondary truncate">{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={() => { setShowMobileMenu(false); signOut() }}
                  className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer flex items-center gap-3 text-danger transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowMobileMenu(false); signIn() }}
                className="w-full px-4 py-3 text-left hover:bg-surface-hover text-sm cursor-pointer flex items-center gap-3 transition-colors duration-150"
              >
                <User className="w-4 h-4 text-text-tertiary" />
                <span>Entrar com Google</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
