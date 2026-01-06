import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { api } from '../api/client'
import type { SongListItem, SetlistListItem, SongLine } from '@songbook/shared'
import { parseContent } from '../utils/parser'

// Hook para debounce - evita recalcular filter a cada keystroke
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
  // Para adicionar música ao setlist com tom, bpm e notas
  onSelectSongWithDetails?: (song: SongListItem, data: SetlistSongData) => void
}

const Icons = {
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function NotesPreview({ lines }: { lines: SongLine[] }) {
  if (lines.length === 0) {
    return <div className="text-neutral-500 text-sm">Preview das notas...</div>
  }

  return (
    <div className="font-mono text-sm space-y-0.5">
      {lines.map((line, i) => (
        <div key={i}>
          {line.chords.length > 0 && (
            <div className="text-amber-400 font-bold whitespace-pre">
              {line.chords.map((c, j) => {
                const prevEnd = j > 0 ? line.chords[j-1].position + line.chords[j-1].chord.length : 0
                const spaces = Math.max(0, c.position - prevEnd)
                return ' '.repeat(spaces) + c.chord
              }).join('')}
            </div>
          )}
          {line.lyrics ? (
            <div className="whitespace-pre-wrap">{line.lyrics}</div>
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

  // Debounce: só filtra após 150ms de inatividade
  const debouncedQuery = useDebouncedValue(query, 150)

  const parsedNotes = useMemo(() => {
    if (!notes.trim()) return []
    return parseContent(notes)
  }, [notes])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Carrega ambos os dados ao abrir
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

  // Fechar com ESC - memoizado para evitar re-bindind desnecessário
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      if (selectedSong) {
        setSelectedSong(null)
      } else {
        onClose()
      }
    }
  }, [onClose, selectedSong])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true) // capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])

  // Filters memoizados com query debounced - evita O(n) a cada keystroke
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

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
            {!selectedSong && (
              <div className="flex bg-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => { setSearchType('songs'); setQuery('') }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors cursor-pointer ${
                    searchType === 'songs'
                      ? 'bg-amber-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Musicas
                </button>
                <button
                  onClick={() => { setSearchType('setlists'); setQuery('') }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors cursor-pointer ${
                    searchType === 'setlists'
                      ? 'bg-amber-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Setlists
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            {Icons.close}
          </button>
        </div>

        {selectedSong ? (
          // Tela de configurar música para o setlist
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-lg text-neutral-100">{selectedSong.title}</div>
                <div className="text-neutral-400">{selectedSong.artist}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {selectedSong.bpm && (
                  <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono">
                    {selectedSong.bpm}
                  </span>
                )}
                {selectedSong.originalKey && (
                  <span className="px-2 py-1 bg-amber-900/50 text-amber-400 rounded text-sm font-mono">
                    {selectedSong.originalKey}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Tom *</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Ex: G, Am, C#m"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:border-neutral-500 text-neutral-100 placeholder:text-neutral-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="Ex: 120"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:border-neutral-500 text-neutral-100 placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Notas</label>
              <div className="grid grid-cols-2 gap-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observacoes para esta musica no setlist...

Ex:
G  D  Em  C
Intro suave"
                  rows={6}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:border-neutral-500 text-neutral-100 resize-none placeholder:text-neutral-500 font-mono text-sm"
                />
                <div className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg overflow-auto max-h-[156px]">
                  <NotesPreview lines={parsedNotes} />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSong(null)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm uppercase tracking-wide cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!key.trim()}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 rounded-lg text-sm uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="p-4 border-b border-neutral-700">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  {Icons.search}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === 'songs' ? 'Buscar musica...' : 'Buscar setlist...'}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:border-neutral-500 text-neutral-100 placeholder:text-neutral-500"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-8 text-center text-neutral-500">Carregando...</div>
              ) : searchType === 'songs' ? (
                filteredSongs.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">Nenhuma musica encontrada</div>
                ) : (
                  <div className="space-y-1">
                    {filteredSongs.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        className="w-full p-4 text-left hover:bg-neutral-800 transition-colors flex items-center justify-between gap-4 rounded-lg cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate text-neutral-100">{song.title}</div>
                          <div className="text-sm text-neutral-400 truncate">{song.artist}</div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {song.bpm && (
                            <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono">
                              {song.bpm}
                            </span>
                          )}
                          {song.originalKey && (
                            <span className="px-2 py-1 bg-amber-900/50 text-amber-400 rounded text-sm font-mono">
                              {song.originalKey}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                filteredSetlists.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">Nenhum setlist encontrado</div>
                ) : (
                  <div className="space-y-1">
                    {filteredSetlists.map((setlist) => (
                      <button
                        key={setlist.id}
                        onClick={() => onSelectSetlist?.(setlist)}
                        className="w-full p-4 text-left hover:bg-neutral-800 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate text-neutral-100">{setlist.name}</div>
                          <div className="text-sm text-neutral-400">{formatDate(setlist.date)}</div>
                        </div>
                        <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono flex-shrink-0">
                          {setlist.songCount}
                        </span>
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
