import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { Route, Switch, useLocation, useParams } from 'wouter'
import { Loader2 } from 'lucide-react'
import { api } from './api/client'
import { useSong } from './hooks/useSong'
import { useSetlist } from './hooks/useSetlist'
import { songCache } from './cache/songCache'
import { useAuth } from './contexts/AuthContext'
import { useWorkspace } from './contexts/WorkspaceContext'
import { Dashboard } from './components/Dashboard'
import { SongViewer } from './components/SongViewer'
import { SongForm } from './components/SongForm'
import { SetlistViewer } from './components/SetlistViewer'
import { SetlistForm } from './components/SetlistForm'
import { SearchModal } from './components/SearchModal'
import { Onboarding } from './components/Onboarding'
import { Layout } from './components/Layout'
import type { SongListItem, SetlistListItem } from '@songbook/shared'

type ModalType = 'songs' | 'setlists' | null

function App() {
  const { user: firebaseUser, loading: authLoading, signIn } = useAuth()
  const { workspace, loading: workspaceLoading, needsOnboarding } = useWorkspace()

  // Show loading while auth or workspace is loading
  if (authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-text-tertiary text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Stage</h1>
          <p className="text-text-secondary mb-8">Gestão de repertório e escalas para ministérios de louvor</p>
          <button
            onClick={signIn}
            className="w-full h-12 bg-accent hover:bg-accent-hover rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 text-bg-primary"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    )
  }

  // Show onboarding if user needs to create/join workspace
  if (needsOnboarding || !workspace) {
    return <Onboarding />
  }

  // Show main app
  return <MainApp />
}

function MainApp() {
  const [modalType, setModalType] = useState<ModalType>(null)
  const [, navigate] = useLocation()

  // ============ NAVIGATION CALLBACKS ============

  const navCallbacks = {
    onSearch: useCallback(() => setModalType('songs'), []),
    onAddSong: useCallback(() => navigate('/songs/new'), [navigate]),
    onAddSetlist: useCallback(() => navigate('/setlists/new'), [navigate]),
  }

  // Atalho global "/" para busca rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (modalType) return

      if (e.key === '/') {
        e.preventDefault()
        setModalType('songs')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalType])

  // ============ MODAL HANDLERS ============

  const handleModalSelectSong = useCallback((song: SongListItem) => {
    setModalType(null)
    navigate(`/songs/${song.id}`)
  }, [navigate])

  const handleModalSelectSetlist = useCallback((setlist: SetlistListItem) => {
    setModalType(null)
    navigate(`/setlists/${setlist.id}`)
  }, [navigate])

  // ============ RENDER MODALS ============

  const renderModals = () => (
    <>
      {modalType && (
        <SearchModal
          onClose={() => setModalType(null)}
          onSelectSong={handleModalSelectSong}
          onSelectSetlist={handleModalSelectSetlist}
        />
      )}
    </>
  )

  // ============ RENDER ============

  return (
    <>
      <Switch>
        <Route path="/songs/new">
          <AddSongPage navCallbacks={navCallbacks} />
        </Route>
        <Route path="/songs/:id/edit">
          <EditSongPage navCallbacks={navCallbacks} />
        </Route>
        <Route path="/songs/:id">
          <ViewSongPage navCallbacks={navCallbacks} renderModals={renderModals} />
        </Route>
        <Route path="/setlists/new">
          <AddSetlistPage navCallbacks={navCallbacks} />
        </Route>
        <Route path="/setlists/:id/edit">
          <EditSetlistPage navCallbacks={navCallbacks} />
        </Route>
        <Route path="/setlists/:setlistId/songs/:position">
          <ViewSetlistSongPage navCallbacks={navCallbacks} renderModals={renderModals} />
        </Route>
        <Route path="/setlists/:id">
          <ViewSetlistPage navCallbacks={navCallbacks} renderModals={renderModals} />
        </Route>
        <Route path="/">
          <DashboardPage navCallbacks={navCallbacks} renderModals={renderModals} />
        </Route>
        <Route>
          <Layout title="404" {...navCallbacks}>
            <div className="flex items-center justify-center h-64">
              <p className="text-neutral-400">Página não encontrada</p>
            </div>
          </Layout>
        </Route>
      </Switch>
    </>
  )
}

// ============ PAGE COMPONENTS ============

interface PageProps {
  navCallbacks: {
    onSearch: () => void
    onAddSong: () => void
    onAddSetlist: () => void
  }
  renderModals?: () => ReactNode
}

function DashboardPage({ navCallbacks, renderModals }: PageProps) {
  return (
    <Layout title="Songbook" subtitle="Suas musicas e setlists" {...navCallbacks}>
      <Dashboard />
      {renderModals?.()}
    </Layout>
  )
}

function AddSongPage({ navCallbacks }: PageProps) {
  const [, navigate] = useLocation()

  return (
    <SongForm
      {...navCallbacks}
      onBack={() => navigate('/')}
      onSaved={(id) => navigate(`/songs/${id}`)}
    />
  )
}

function EditSongPage({ navCallbacks }: PageProps) {
  const { id } = useParams<{ id: string }>()
  const { song, loading } = useSong(id!)
  const [, navigate] = useLocation()

  if (loading) {
    return (
      <Layout title="Carregando..." {...navCallbacks}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!song) {
    return (
      <Layout title="Não encontrada" {...navCallbacks}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Música não encontrada</div>
        </div>
      </Layout>
    )
  }

  return (
    <SongForm
      {...navCallbacks}
      song={song}
      onBack={() => navigate(`/songs/${id}`)}
      onSaved={() => navigate(`/songs/${id}`)}
      onDelete={() => navigate('/')}
    />
  )
}

function ViewSongPage({ navCallbacks, renderModals }: PageProps) {
  const { id } = useParams<{ id: string }>()
  const { song, loading } = useSong(id!)
  const [, navigate] = useLocation()

  useEffect(() => {
    if (id) {
      api.songs.markViewed(id)
    }
  }, [id])

  if (loading) {
    return (
      <Layout title="Carregando..." {...navCallbacks}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!song) {
    return (
      <Layout title="Não encontrada" {...navCallbacks}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Música não encontrada</div>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <SongViewer
        {...navCallbacks}
        song={song}
        onBack={() => navigate('/')}
        onEdit={() => navigate(`/songs/${id}/edit`)}
      />
      {renderModals?.()}
    </>
  )
}

function AddSetlistPage({ navCallbacks }: PageProps) {
  const [, navigate] = useLocation()

  return (
    <SetlistForm
      {...navCallbacks}
      onBack={() => navigate('/')}
      onSaved={(id) => navigate(`/setlists/${id}`)}
    />
  )
}

function EditSetlistPage({ navCallbacks }: PageProps) {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()

  return (
    <SetlistForm
      {...navCallbacks}
      setlistId={id}
      onBack={() => navigate(`/setlists/${id}`)}
      onSaved={() => navigate(`/setlists/${id}`)}
      onDelete={() => navigate('/')}
    />
  )
}

function ViewSetlistPage({ navCallbacks, renderModals }: PageProps) {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (id) {
      api.setlists.markViewed(id)
    }
  }, [id])

  return (
    <>
      <SetlistViewer
        {...navCallbacks}
        setlistId={id!}
        onBack={() => navigate('/')}
        onEdit={() => navigate(`/setlists/${id}/edit`)}
        onViewSong={(_songId, _key, _bpm, _notes, _itemId, _allSongs, position) => {
          navigate(`/setlists/${id}/songs/${position}`)
        }}
      />
      {renderModals?.()}
    </>
  )
}

function ViewSetlistSongPage({ navCallbacks, renderModals }: PageProps) {
  const { setlistId, position } = useParams<{ setlistId: string; position: string }>()
  const { setlist, loading: loadingSetlist } = useSetlist(setlistId!)
  const positionNum = parseInt(position!, 10)

  const [, navigate] = useLocation()

  // Encontrar a música na posição
  const setlistSong = setlist?.songs[positionNum]
  const { song, loading: loadingSong } = useSong(setlistSong?.songId || null)

  // Prefetch todas as músicas do setlist quando carrega
  useEffect(() => {
    if (setlist && setlist.songs.length > 0) {
      const songIds = setlist.songs.map(s => s.songId)
      songCache.prefetchSetlist(songIds)
    }
  }, [setlist])

  useEffect(() => {
    if (setlistSong?.songId) {
      api.songs.markViewed(setlistSong.songId)
    }
  }, [setlistSong?.songId])

  const loading = loadingSetlist || loadingSong

  if (loading) {
    return (
      <Layout title="Carregando..." {...navCallbacks}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!setlist || !setlistSong || !song) {
    return (
      <Layout title="Não encontrada" {...navCallbacks}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Música não encontrada</div>
        </div>
      </Layout>
    )
  }

  // Preparar info de navegação do setlist
  const setlistSongsInfo = setlist.songs.map((s, idx) => ({
    songId: s.songId,
    key: s.key,
    bpm: s.bpm,
    notes: s.notes,
    itemId: s.id,
    position: idx,
  }))

  return (
    <>
      <SongViewer
        {...navCallbacks}
        song={song}
        onBack={() => navigate(`/setlists/${setlistId}`)}
        onEdit={() => navigate(`/songs/${song.id}/edit`)}
        initialTranspose={setlistSong.key}
        bpmOverride={setlistSong.bpm}
        notes={setlistSong.notes}
        setlistId={setlistId}
        setlistItemId={setlistSong.id}
        setlistSongs={setlistSongsInfo}
        onNavigateToSong={(_songId, _key, _bpm, _notes, _itemId, _allSongs, newPosition) => {
          if (newPosition !== undefined) {
            navigate(`/setlists/${setlistId}/songs/${newPosition}`)
          }
        }}
        onNotesUpdated={() => {
          // Notas atualizadas via API, refetch do setlist se necessário
        }}
      />
      {renderModals?.()}
    </>
  )
}

export default App
