import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Song, SongLine } from '@songbook/shared'
import { getSectionColor } from '@songbook/shared'
import { transposeChord, getKeyFromSemitones, getSemitonesBetweenKeys } from '../utils/transpose'
import { Layout } from './Layout'
import { FloatingControls } from './FloatingControls'
import { NotesSidebar } from './NotesSidebar'
import { SectionMinimap } from './SectionMinimap'
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
  onSearch: () => void
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

const ChordLine = React.forwardRef<HTMLDivElement, {
  line: SongLine
  transpose: number
  preference: AccidentalPreference
}>(({ line, transpose, preference }, ref) => {
  if (line.chords.length === 0 && !line.lyrics && !line.section) {
    return <div ref={ref} className="h-4" />
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

  const sectionColor = line.section ? getSectionColor(line.section) : ''

  return (
    <div
      ref={ref}
      className="leading-relaxed scroll-mt-20"
    >
      {line.section && (
        <span
          className="inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wide mb-1"
          style={{
            color: sectionColor,
            backgroundColor: sectionColor.replace('hsl(', 'hsla(').replace(')', ', 0.2)')
          }}
        >
          {line.section}
        </span>
      )}
      {renderChords()}
      {line.lyrics && (
        <div className="whitespace-pre-wrap">{line.lyrics}</div>
      )}
    </div>
  )
})

ChordLine.displayName = 'ChordLine'

export function SongViewer({
  song,
  onBack,
  onEdit,
  onHome,
  onSearch,
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
  const [localNotes, setLocalNotes] = useState(notes || '')
  const [notesMinimized, setNotesMinimized] = useState(!notes?.trim())
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const isNavigatingRef = useRef(false)

  // Get section indices for navigation
  const sectionIndices = useMemo(() => {
    const indices: number[] = []
    song.content.forEach((line, index) => {
      if (line.section) {
        indices.push(index)
      }
    })
    return indices
  }, [song.content])

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

  // Foco automático no container ao entrar na música
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true })
  }, [song.id])

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
  }

  // Scroll to section
  const handleNavigateToSection = useCallback((lineIndex: number) => {
    // Atualiza o índice da seção diretamente
    const sectionIdx = sectionIndices.indexOf(lineIndex)
    if (sectionIdx !== -1) {
      setCurrentSectionIndex(sectionIdx)
    }

    // Bloqueia o scroll handler temporariamente
    isNavigatingRef.current = true

    const lineEl = lineRefs.current[lineIndex]
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Libera o scroll handler após a animação
    setTimeout(() => {
      isNavigatingRef.current = false
    }, 500)
  }, [sectionIndices])

  // Track current section on scroll - com throttle via requestAnimationFrame
  useEffect(() => {
    const container = contentRef.current
    if (!container || sectionIndices.length === 0) return

    let rafId: number | null = null
    let lastActiveIndex = 0

    const updateSection = () => {
      rafId = null

      // Ignora durante navegação programática
      if (isNavigatingRef.current) return

      const containerTop = container.getBoundingClientRect().top
      let activeIndex = 0

      for (let i = sectionIndices.length - 1; i >= 0; i--) {
        const lineEl = lineRefs.current[sectionIndices[i]]
        if (lineEl) {
          const lineTop = lineEl.getBoundingClientRect().top
          if (lineTop <= containerTop + 100) {
            activeIndex = i
            break
          }
        }
      }

      // Só atualiza state se mudou (evita re-renders desnecessários)
      if (activeIndex !== lastActiveIndex) {
        lastActiveIndex = activeIndex
        setCurrentSectionIndex(activeIndex)
      }
    }

    const handleScroll = () => {
      // Throttle: máximo 1 execução por frame (60fps)
      if (rafId === null) {
        rafId = requestAnimationFrame(updateSection)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [sectionIndices])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [onBack, setlistItemId, setlistSongs, onNavigateToSong])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Preparar props do setlistNav para a TopBar
  const setlistNav = currentPosition >= 0 && setlistSongs ? {
    current: currentPosition + 1,
    total: setlistSongs.length,
    onPrev: () => handleNavigate('prev'),
    onNext: () => handleNavigate('next'),
    canGoPrev,
    canGoNext,
  } : undefined

  return (
    <Layout
      title={song.title}
      subtitle={song.artist}
      onHome={onHome}
      onSearch={onSearch}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
      onEdit={onEdit}
      setlistNav={setlistNav}
      bpm={bpmOverride || song.bpm}
      originalKey={song.originalKey}
    >
      {/* FloatingControls - fixed relativo ao viewport */}
      <div
        className="fixed z-40 left-1/2 flex justify-end pr-5"
        style={{ top: 'calc(3rem + 1.5rem)', marginLeft: 'calc(-28rem - 8rem)', width: '8rem' }}
      >
        <FloatingControls
          currentKey={currentKey}
          onTransposeDown={() => setTranspose(t => t - 1)}
          onTransposeUp={() => setTranspose(t => t + 1)}
          onKeySelect={handleSelectKey}
          onFontDecrease={() => setFontSize(s => Math.max(12, s - 2))}
          onFontIncrease={() => setFontSize(s => Math.min(32, s + 2))}
          youtubeUrl={song.youtubeUrl}
        />
      </div>

      {/* Section Minimap - fixed relativo ao viewport */}
      {sectionIndices.length > 0 && (
        <div
          className="fixed z-40 left-1/2 flex justify-start pl-5"
          style={{ top: 'calc(3rem + 1.5rem)', marginLeft: '28rem', width: '8rem' }}
        >
          <SectionMinimap
            content={song.content}
            currentSection={currentSectionIndex}
            onNavigate={handleNavigateToSection}
          />
        </div>
      )}

      {/* Conteudo scrollável */}
      <div
        ref={contentRef}
        tabIndex={0}
        className="flex-1 p-6 overflow-auto outline-none"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="font-mono space-y-1">
            {song.content.map((line, i) => (
              <ChordLine
                key={i}
                ref={el => { lineRefs.current[i] = el }}
                line={line}
                transpose={transpose}
                preference={preference}
              />
            ))}
          </div>
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
