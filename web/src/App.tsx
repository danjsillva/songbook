import { useState, useEffect, useCallback } from 'react'
import { api } from './api/client'
import { useSong } from './hooks/useSong'
import { Dashboard } from './components/Dashboard'
import { SongViewer } from './components/SongViewer'
import { SongForm } from './components/SongForm'
import { SetlistViewer } from './components/SetlistViewer'
import { SetlistForm } from './components/SetlistForm'
import { SearchModal } from './components/SearchModal'
import { Layout } from './components/Layout'
import type { SongListItem, SetlistListItem } from '@songbook/shared'

type View = 'dashboard' | 'view-song' | 'edit-song' | 'add-song' | 'view-setlist' | 'edit-setlist' | 'add-setlist'
type ModalType = 'songs' | 'setlists' | null

interface SetlistSongInfo {
  songId: string
  key: string
  bpm: number | null
  notes: string | null
  itemId: string
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null)
  const [selectedSetlistItemId, setSelectedSetlistItemId] = useState<string | null>(null)
  const [setlistSongsInfo, setSetlistSongsInfo] = useState<SetlistSongInfo[]>([])
  const [songKeyOverride, setSongKeyOverride] = useState<string | null>(null)
  const [songBpmOverride, setSongBpmOverride] = useState<number | null>(null)
  const [songNotes, setSongNotes] = useState<string | null>(null)
  const [modalType, setModalType] = useState<ModalType>(null)

  const { song, loading: loadingSong, refetch: refetchSong } = useSong(selectedSongId)

  // Marcar como visualizado quando abrir
  useEffect(() => {
    if (view === 'view-song' && selectedSongId) {
      api.songs.markViewed(selectedSongId)
    }
  }, [view, selectedSongId])

  useEffect(() => {
    if (view === 'view-setlist' && selectedSetlistId) {
      api.setlists.markViewed(selectedSetlistId)
    }
  }, [view, selectedSetlistId])

  // ============ NAVIGATION CALLBACKS ============

  const navCallbacks = {
    onHome: useCallback(() => {
      setSelectedSongId(null)
      setSelectedSetlistId(null)
      setSelectedSetlistItemId(null)
      setSetlistSongsInfo([])
      setSongKeyOverride(null)
      setSongBpmOverride(null)
      setSongNotes(null)
      setView('dashboard')
    }, []),
    onSearch: useCallback(() => setModalType('songs'), []),
    onAddSong: useCallback(() => setView('add-song'), []),
    onAddSetlist: useCallback(() => setView('add-setlist'), []),
  }

  // Atalho global "/" para busca rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      // Ignorar se modal já estiver aberto
      if (modalType) return

      if (e.key === '/') {
        e.preventDefault()
        setModalType('songs')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalType])

  // ============ SONG HANDLERS ============

  const handleSelectSong = useCallback((id: string) => {
    setSelectedSongId(id)
    setSelectedSetlistItemId(null)
    setSongKeyOverride(null)
    setSongBpmOverride(null)
    setSongNotes(null)
    setModalType(null)
    setView('view-song')
  }, [])

  const handleSongSaved = useCallback((id: string) => {
    setSelectedSongId(id)
    refetchSong()
    setView('view-song')
  }, [refetchSong])

  const handleSongDeleted = useCallback(() => {
    setSelectedSongId(null)
    setView('dashboard')
  }, [])

  // ============ SETLIST HANDLERS ============

  const handleSelectSetlist = useCallback((id: string) => {
    setSelectedSetlistId(id)
    setModalType(null)
    setView('view-setlist')
  }, [])

  const handleSetlistSaved = useCallback((id: string) => {
    setSelectedSetlistId(id)
    setView('view-setlist')
  }, [])

  const handleSetlistDeleted = useCallback(() => {
    setSelectedSetlistId(null)
    setView('dashboard')
  }, [])

  const handleViewSongFromSetlist = useCallback((songId: string, key: string, bpm: number | null, notes: string | null, itemId: string, allSongs?: SetlistSongInfo[]) => {
    setSelectedSongId(songId)
    setSelectedSetlistItemId(itemId)
    if (allSongs) {
      setSetlistSongsInfo(allSongs)
    }
    setSongKeyOverride(key)
    setSongBpmOverride(bpm)
    setSongNotes(notes)
    setView('view-song')
  }, [])

  const handleNotesUpdated = useCallback((itemId: string, newNotes: string | null) => {
    setSongNotes(newNotes)
    setSetlistSongsInfo(prev => prev.map(s =>
      s.itemId === itemId ? { ...s, notes: newNotes } : s
    ))
  }, [])

  // ============ MODAL HANDLERS ============

  const handleModalSelectSong = useCallback((song: SongListItem) => {
    handleSelectSong(song.id)
  }, [handleSelectSong])

  const handleModalSelectSetlist = useCallback((setlist: SetlistListItem) => {
    handleSelectSetlist(setlist.id)
  }, [handleSelectSetlist])

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

  // Add song
  if (view === 'add-song') {
    return (
      <SongForm
        {...navCallbacks}
        onBack={navCallbacks.onHome}
        onSaved={handleSongSaved}
      />
    )
  }

  // Edit song
  if (view === 'edit-song' && song) {
    return (
      <SongForm
        {...navCallbacks}
        song={song}
        onBack={() => setView('view-song')}
        onSaved={handleSongSaved}
        onDelete={handleSongDeleted}
      />
    )
  }

  // View song
  if (view === 'view-song' && song) {
    return (
      <>
        <SongViewer
          {...navCallbacks}
          song={song}
          onBack={() => {
            if (selectedSetlistId) {
              setView('view-setlist')
            } else {
              navCallbacks.onHome()
            }
          }}
          onEdit={() => setView('edit-song')}
          initialTranspose={songKeyOverride}
          bpmOverride={songBpmOverride}
          notes={songNotes}
          setlistId={selectedSetlistId}
          setlistItemId={selectedSetlistItemId}
          setlistSongs={setlistSongsInfo}
          onNavigateToSong={handleViewSongFromSetlist}
          onNotesUpdated={handleNotesUpdated}
        />
        {renderModals()}
      </>
    )
  }

  // Loading song
  if ((view === 'view-song' || view === 'edit-song') && loadingSong) {
    return (
      <Layout title="Carregando..." {...navCallbacks}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Carregando...</div>
        </div>
      </Layout>
    )
  }

  // Add setlist
  if (view === 'add-setlist') {
    return (
      <SetlistForm
        {...navCallbacks}
        onBack={navCallbacks.onHome}
        onSaved={handleSetlistSaved}
      />
    )
  }

  // Edit setlist
  if (view === 'edit-setlist' && selectedSetlistId) {
    return (
      <SetlistForm
        {...navCallbacks}
        setlistId={selectedSetlistId}
        onBack={() => setView('view-setlist')}
        onSaved={handleSetlistSaved}
        onDelete={handleSetlistDeleted}
      />
    )
  }

  // View setlist
  if (view === 'view-setlist' && selectedSetlistId) {
    return (
      <>
        <SetlistViewer
          {...navCallbacks}
          setlistId={selectedSetlistId}
          onBack={navCallbacks.onHome}
          onEdit={() => setView('edit-setlist')}
          onViewSong={handleViewSongFromSetlist}
        />
        {renderModals()}
      </>
    )
  }

  // Dashboard (default)
  return (
    <Layout title="Songbook" subtitle="Suas musicas e setlists" {...navCallbacks}>
      <Dashboard
        onSelectSong={handleSelectSong}
        onSelectSetlist={handleSelectSetlist}
      />
      {renderModals()}
    </Layout>
  )
}

export default App
