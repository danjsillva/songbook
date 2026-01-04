import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song, SongLine } from '@songbook/shared'
import { transposeChord, getKeyFromSemitones, getSemitonesBetweenKeys } from '../utils/transpose'
import { Layout, SidebarButton } from './Layout'
import { NotesSidebar } from './NotesSidebar'
import { api } from '../api/client'

interface SetlistSongInfo {
  songId: string
  key: string
  bpm: number | null
  notes: string | null
  itemId: string
}

interface SongViewerProps {
  song: Song
  onBack: () => void
  onEdit: () => void
  onHome: () => void
  onSearchSongs: () => void
  onSearchSetlists: () => void
  onAddSong: () => void
  onAddSetlist: () => void
  initialTranspose?: string | null
  bpmOverride?: number | null
  notes?: string | null
  setlistId?: string | null
  setlistItemId?: string | null
  setlistSongs?: SetlistSongInfo[]
  onNavigateToSong?: (songId: string, key: string, bpm: number | null, notes: string | null, itemId: string, allSongs?: SetlistSongInfo[]) => void
  onNotesUpdated?: (itemId: string, notes: string | null) => void
}

type AccidentalPreference = 'sharp' | 'flat'

const Icons = {
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  minus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  arrowUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  arrowDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
}

const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

interface KeySelectorProps {
  currentKey: string
  onSelectKey: (key: string) => void
  onClose: () => void
}

function KeySelector({ currentKey, onSelectKey, onClose }: KeySelectorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const currentRoot = currentKey.replace('m', '').replace('M', '')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timeout = setTimeout(() => {
      window.addEventListener('click', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-16 top-0 bg-neutral-800 border border-neutral-700 rounded-xl p-3 shadow-xl z-50"
    >
      <div className="grid grid-cols-4 gap-2">
        {ALL_KEYS.map(key => (
          <button
            key={key}
            onClick={() => onSelectKey(key)}
            className={`w-10 h-10 rounded-lg text-sm font-mono transition-colors cursor-pointer flex items-center justify-center ${
              currentRoot === key
                ? 'bg-amber-600 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChordLine({ line, transpose, preference }: {
  line: SongLine
  transpose: number
  preference: AccidentalPreference
}) {
  if (line.chords.length === 0 && !line.lyrics) {
    return <div className="h-4" />
  }

  const renderChords = () => {
    if (line.chords.length === 0) return null

    let chordLine = ''
    let lastEnd = 0

    for (const { chord, position } of line.chords) {
      const transposed = transposeChord(chord, transpose, preference)
      const spaces = Math.max(0, position - lastEnd)
      chordLine += ' '.repeat(spaces) + transposed
      lastEnd = position + transposed.length
    }

    return (
      <div className="text-amber-400 font-bold whitespace-pre font-mono">
        {chordLine}
      </div>
    )
  }

  return (
    <div className="leading-relaxed">
      {renderChords()}
      {line.lyrics && (
        <div className="whitespace-pre-wrap">{line.lyrics}</div>
      )}
    </div>
  )
}

export function SongViewer({
  song,
  onBack,
  onEdit,
  onHome,
  onSearchSongs,
  onSearchSetlists,
  onAddSong,
  onAddSetlist,
  initialTranspose,
  bpmOverride,
  notes,
  setlistId,
  setlistItemId,
  setlistSongs,
  onNavigateToSong,
  onNotesUpdated
}: SongViewerProps) {
  const [transpose, setTranspose] = useState(() => {
    if (initialTranspose && song.originalKey) {
      return getSemitonesBetweenKeys(song.originalKey, initialTranspose)
    }
    return 0
  })
  const [fontSize, setFontSize] = useState(18)
  const [preference] = useState<AccidentalPreference>('sharp')
  const [showKeySelector, setShowKeySelector] = useState(false)
  const [localNotes, setLocalNotes] = useState(notes || '')
  const [notesMinimized, setNotesMinimized] = useState(!notes?.trim())
  const contentRef = useRef<HTMLDivElement>(null)

  // Atualizar estado quando mudar o item do setlist (mesmo que seja a mesma musica)
  useEffect(() => {
    setLocalNotes(notes || '')
    setNotesMinimized(!notes?.trim())
    // Recalcular transpose baseado no novo tom
    if (initialTranspose && song.originalKey) {
      setTranspose(getSemitonesBetweenKeys(song.originalKey, initialTranspose))
    } else {
      setTranspose(0)
    }
  }, [notes, song.id, song.originalKey, initialTranspose, setlistItemId])

  const currentKey = getKeyFromSemitones(song.originalKey, transpose, preference)

  // Posição atual no setlist e navegação
  const currentPosition = setlistSongs?.findIndex(s => s.itemId === setlistItemId) ?? -1
  const canGoPrev = currentPosition > 0
  const canGoNext = currentPosition >= 0 && currentPosition < (setlistSongs?.length ?? 0) - 1

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!setlistSongs || !onNavigateToSong) return
    const newIndex = direction === 'prev' ? currentPosition - 1 : currentPosition + 1
    const targetSong = setlistSongs[newIndex]
    if (targetSong) {
      onNavigateToSong(targetSong.songId, targetSong.key, targetSong.bpm, targetSong.notes, targetSong.itemId)
    }
  }, [setlistSongs, onNavigateToSong, currentPosition])

  const handleSaveNotes = useCallback(async (newNotes: string) => {
    if (!setlistId || !setlistItemId) return
    try {
      await api.setlists.updateItem(setlistId, setlistItemId, {
        notes: newNotes || null
      })
      setLocalNotes(newNotes)
      onNotesUpdated?.(setlistItemId, newNotes || null)
    } catch (err) {
      console.error('Erro ao salvar notas:', err)
    }
  }, [setlistId, setlistItemId, onNotesUpdated])

  const handleSelectKey = (key: string) => {
    if (song.originalKey) {
      setTranspose(getSemitonesBetweenKeys(song.originalKey, key))
    }
    setShowKeySelector(false)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showKeySelector) return

    // Ignorar se estiver em input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    switch (e.key) {
      case 'Escape':
        onBack()
        break
      case '+':
      case '=':
        setTranspose(t => t + 1)
        break
      case '-':
        setTranspose(t => t - 1)
        break
      case 'ArrowUp':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setFontSize(s => Math.min(32, s + 2))
        }
        break
      case 'ArrowDown':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setFontSize(s => Math.max(12, s - 2))
        }
        break
      case 'n':
        if (setlistItemId) {
          setNotesMinimized(m => !m)
        }
        break
      case ' ':
        e.preventDefault()
        if (contentRef.current) {
          const direction = e.shiftKey ? -1 : 1
          contentRef.current.scrollBy({ top: direction * window.innerHeight * 0.8, behavior: 'smooth' })
        }
        break
      case '0':
        setFontSize(s => Math.min(32, s + 2))
        break
      case '9':
        setFontSize(s => Math.max(12, s - 2))
        break
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        if (setlistSongs && onNavigateToSong) {
          const index = parseInt(e.key) - 1
          const targetSong = setlistSongs[index]
          if (targetSong && targetSong.itemId !== setlistItemId) {
            onNavigateToSong(targetSong.songId, targetSong.key, targetSong.bpm, targetSong.notes, targetSong.itemId)
          }
        }
        break
    }
  }, [onBack, showKeySelector, setlistItemId, setlistSongs, onNavigateToSong, song.id])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const pageControls = (
    <>
      {/* Controles de fonte */}
      <SidebarButton onClick={() => setFontSize(s => Math.max(12, s - 2))} title="Diminuir fonte">
        <span className="text-xs font-bold">A-</span>
      </SidebarButton>
      <SidebarButton onClick={() => setFontSize(s => Math.min(32, s + 2))} title="Aumentar fonte">
        <span className="text-sm font-bold">A+</span>
      </SidebarButton>

      {/* Tom atual */}
      <div className="relative">
        <button
          onClick={() => setShowKeySelector(!showKeySelector)}
          title="Selecionar tom"
          className="w-12 h-12 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-mono font-bold text-amber-400 transition-colors cursor-pointer"
        >
          {currentKey}
        </button>
        {showKeySelector && (
          <KeySelector
            currentKey={currentKey}
            onSelectKey={handleSelectKey}
            onClose={() => setShowKeySelector(false)}
          />
        )}
      </div>

      {/* Transposicao */}
      <SidebarButton onClick={() => setTranspose(t => t - 1)} title="Transpor -1 (-)">
        {Icons.minus}
      </SidebarButton>
      <SidebarButton onClick={() => setTranspose(t => t + 1)} title="Transpor +1 (+)">
        {Icons.plus}
      </SidebarButton>

      {song.youtubeUrl && (
        <a
          href={song.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors hover:bg-neutral-800 text-red-500 hover:text-red-400 cursor-pointer"
          title="Abrir no YouTube"
        >
          {Icons.youtube}
        </a>
      )}
    </>
  )

  return (
    <Layout
      onHome={onHome}
      onSearchSongs={onSearchSongs}
      onSearchSetlists={onSearchSetlists}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
      pageControls={pageControls}
    >
      {/* Header */}
      <div className="p-6 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            {/* Posição e navegação do setlist */}
            {currentPosition >= 0 && (
              <>
                <span className="text-neutral-500 text-xl font-semibold w-6 text-center flex-shrink-0">
                  {currentPosition + 1}
                </span>
                <div className="flex flex-col flex-shrink-0">
                  <button
                    onClick={() => handleNavigate('prev')}
                    disabled={!canGoPrev}
                    className="p-0.5 text-neutral-600 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    title="Música anterior"
                  >
                    {Icons.arrowUp}
                  </button>
                  <button
                    onClick={() => handleNavigate('next')}
                    disabled={!canGoNext}
                    className="p-0.5 text-neutral-600 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    title="Próxima música"
                  >
                    {Icons.arrowDown}
                  </button>
                </div>
              </>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{song.title}</h1>
                <button
                  onClick={onEdit}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                  title="Editar"
                >
                  {Icons.edit}
                </button>
              </div>
              <span className="text-neutral-400">{song.artist}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {setlistItemId && (
              localNotes ? (
                <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded text-sm font-mono">
                  Notas
                </span>
              ) : (
                <span className="px-2 py-1 bg-neutral-800 text-neutral-600 rounded text-sm font-mono">
                  Notas
                </span>
              )
            )}
            {(bpmOverride || song.bpm) && (
              <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono">
                {bpmOverride || song.bpm} BPM
              </span>
            )}
            {song.originalKey && (
              <span className="px-2 py-1 bg-amber-900/50 text-amber-400 rounded text-sm font-mono">
                {song.originalKey}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conteudo */}
      <div
        ref={contentRef}
        className="p-6 overflow-auto"
        style={{ fontSize: `${fontSize}px`, height: 'calc(100vh - 100px)' }}
      >
        <div className="font-mono space-y-1 max-w-4xl mx-auto">
          {song.content.map((line, i) => (
            <ChordLine
              key={i}
              line={line}
              transpose={transpose}
              preference={preference}
            />
          ))}
        </div>
      </div>

      {/* Sidebar de notas (quando vem de um setlist) */}
      {setlistItemId && (
        <NotesSidebar
          notes={localNotes}
          onSave={handleSaveNotes}
          minimized={notesMinimized}
          onToggleMinimized={() => setNotesMinimized(m => !m)}
        />
      )}
    </Layout>
  )
}
