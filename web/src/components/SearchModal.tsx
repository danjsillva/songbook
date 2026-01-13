import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  X,
  Search,
  Loader2,
} from 'lucide-react'
import { api } from '../api/client'
import type { SongListItem, SetlistListItem, SongLine } from '@songbook/shared'
import { parseContent } from '../utils/parser'
import { Badge } from './Layout'

// Hook for debounce - avoids recalculating filter on every keystroke
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export interface SetlistSongData {
  key: string
  bpm?: number
  notes?: string
}

interface SearchModalProps {
  type?: 'songs' | 'setlists'
  onClose: () => void
  onSelectSong?: (song: SongListItem) => void
  onSelectSetlist?: (setlist: SetlistListItem) => void
  // For adding song to setlist with key, bpm and notes
  onSelectSongWithDetails?: (song: SongListItem, data: SetlistSongData) => void
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function NotesPreview({ lines }: { lines: SongLine[] }) {
  if (lines.length === 0) {
    return <div className="text-text-tertiary text-sm">Preview das notas...</div>
  }

  return (
    <div className="font-mono text-sm space-y-0.5">
      {lines.map((line, i) => (
        <div key={i}>
          {line.chords.length > 0 && (
            <div className="text-accent font-bold whitespace-pre">
              {line.chords.map((c, j) => {
                const prevEnd = j > 0 ? line.chords[j-1].position + line.chords[j-1].chord.length : 0
                const spaces = Math.max(0, c.position - prevEnd)
                return ' '.repeat(spaces) + c.chord
              }).join('')}
            </div>
          )}
          {line.lyrics ? (
            <div className="whitespace-pre-wrap text-text-primary">{line.lyrics}</div>
          ) : line.chords.length === 0 ? (
            <div className="h-3" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function SearchModal({
  type = 'songs',
  onClose,
  onSelectSong,
  onSelectSetlist,
  onSelectSongWithDetails,
}: SearchModalProps) {
  const [searchType, setSearchType] = useState<'songs' | 'setlists'>(type)
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState<SongListItem[]>([])
  const [setlists, setSetlists] = useState<SetlistListItem[]>([])
  const [loadingSongs, setLoadingSongs] = useState(true)
  const [loadingSetlists, setLoadingSetlists] = useState(true)
  const [selectedSong, setSelectedSong] = useState<SongListItem | null>(null)
  const [key, setKey] = useState('')
  const [bpm, setBpm] = useState('')
  const [notes, setNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce: only filter after 150ms of inactivity
  const debouncedQuery = useDebouncedValue(query, 150)

  const parsedNotes = useMemo(() => {
    if (!notes.trim()) return []
    return parseContent(notes)
  }, [notes])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load both data on open
  useEffect(() => {
    api.songs.list().then((data) => {
      setSongs(data)
      setLoadingSongs(false)
    })
    api.setlists.list().then((data) => {
      setSetlists(data)
      setLoadingSetlists(false)
    })
  }, [])

  const loading = searchType === 'songs' ? loadingSongs : loadingSetlists

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      if (selectedSong) {
        setSelectedSong(null)
      } else {
        onClose()
      }
    }
    // Tab toggles between songs and setlists (only when not on details screen)
    if (e.key === 'Tab' && !selectedSong) {
      e.preventDefault()
      setSearchType(prev => prev === 'songs' ? 'setlists' : 'songs')
      setQuery('')
    }
  }, [onClose, selectedSong])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true) // capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])

  // Memoized filters with debounced query - avoids O(n) on every keystroke
  const filteredSongs = useMemo(() => {
    const q = debouncedQuery.toLowerCase()
    if (!q) return songs
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    )
  }, [songs, debouncedQuery])

  const filteredSetlists = useMemo(() => {
    const q = debouncedQuery.toLowerCase()
    if (!q) return setlists
    return setlists.filter((s) => s.name.toLowerCase().includes(q))
  }, [setlists, debouncedQuery])

  const handleSelectSong = (song: SongListItem) => {
    if (onSelectSongWithDetails) {
      setSelectedSong(song)
      setKey(song.originalKey || '')
      setBpm(song.bpm?.toString() || '')
      setNotes('')
    } else if (onSelectSong) {
      onSelectSong(song)
    }
  }

  const handleConfirm = () => {
    if (selectedSong && key.trim() && onSelectSongWithDetails) {
      onSelectSongWithDetails(selectedSong, {
        key: key.trim(),
        bpm: bpm.trim() ? parseInt(bpm.trim(), 10) : undefined,
        notes: notes.trim() || undefined,
      })
    }
  }

  const title = searchType === 'songs'
    ? (selectedSong ? 'Adicionar ao Setlist' : 'Buscar')
    : 'Buscar'

  const inputClasses = "w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-border-hover text-text-primary placeholder:text-text-muted transition-all duration-200"

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 pt-16 sm:pt-20 px-4 pb-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-elevated rounded-2xl w-full max-w-2xl max-h-[calc(100vh-6rem)] flex flex-col animate-scale-in border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {!selectedSong && (
              <div className="flex bg-surface rounded-xl p-1">
                <button
                  onClick={() => { setSearchType('songs'); setQuery('') }}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer font-medium ${
                    searchType === 'songs'
                      ? 'bg-accent text-bg-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Musicas
                </button>
                <button
                  onClick={() => { setSearchType('setlists'); setQuery('') }}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer font-medium ${
                    searchType === 'setlists'
                      ? 'bg-accent text-bg-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Setlists
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-text-tertiary hover:text-text-primary rounded-xl hover:bg-surface cursor-pointer transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedSong ? (
          // Configure song for setlist screen
          <div className="p-5 space-y-5 overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-lg text-text-primary">{selectedSong.title}</div>
                <div className="text-text-tertiary">{selectedSong.artist}</div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {selectedSong.bpm && <Badge size="sm">{selectedSong.bpm} bpm</Badge>}
                {selectedSong.originalKey && <Badge variant="accent" size="sm">{selectedSong.originalKey}</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Tom *</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Ex: G, Am, C#m"
                  className={inputClasses}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="Ex: 120"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Notas</label>
              <div className="grid grid-cols-2 gap-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observacoes para esta musica no setlist...

Ex:
G  D  Em  C
Intro suave"
                  rows={6}
                  className={`${inputClasses} resize-none font-mono text-sm`}
                />
                <div className="px-4 py-3 bg-surface border border-border rounded-xl overflow-auto max-h-[168px]">
                  <NotesPreview lines={parsedNotes} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedSong(null)}
                className="flex-1 h-12 bg-surface hover:bg-surface-hover rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 text-text-secondary"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!key.trim()}
                className="flex-1 h-12 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-muted rounded-xl text-sm font-semibold cursor-pointer disabled:cursor-not-allowed transition-all duration-200 text-bg-primary"
              >
                Adicionar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="p-5 border-b border-border-subtle">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === 'songs' ? 'Buscar musica...' : 'Buscar setlist...'}
                  className={`${inputClasses} pl-12`}
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-8 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  <span className="text-text-tertiary text-sm">Carregando...</span>
                </div>
              ) : searchType === 'songs' ? (
                filteredSongs.length === 0 ? (
                  <div className="p-8 text-center text-text-tertiary">Nenhuma musica encontrada</div>
                ) : (
                  <div className="p-2">
                    {filteredSongs.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        className="w-full p-4 text-left hover:bg-surface transition-all duration-200 flex items-center justify-between gap-4 rounded-xl cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate text-text-primary">{song.title}</div>
                          <div className="text-sm text-text-tertiary truncate">{song.artist}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {song.bpm && <Badge size="sm">{song.bpm}</Badge>}
                          {song.originalKey && <Badge variant="accent" size="sm">{song.originalKey}</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                filteredSetlists.length === 0 ? (
                  <div className="p-8 text-center text-text-tertiary">Nenhum setlist encontrado</div>
                ) : (
                  <div className="p-2">
                    {filteredSetlists.map((setlist) => (
                      <button
                        key={setlist.id}
                        onClick={() => onSelectSetlist?.(setlist)}
                        className="w-full p-4 text-left hover:bg-surface transition-all duration-200 flex items-center justify-between gap-4 rounded-xl cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate text-text-primary">{setlist.name}</div>
                          <div className="text-sm text-text-tertiary">{formatDate(setlist.date)}</div>
                        </div>
                        <Badge size="sm">{setlist.songCount}</Badge>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
