import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Song, SongLine } from '@songbook/shared'
import { getSectionColor } from '@songbook/shared'
import { transposeChord, getKeyFromSemitones, getSemitonesBetweenKeys } from '../utils/transpose'
import { Layout } from './Layout'
import { FloatingControls } from './FloatingControls'
import { NotesSidebar } from './NotesSidebar'
import { SectionMinimap } from './SectionMinimap'
import { AuthorBadge } from './AuthorBadge'
import { api } from '../api/client'
import { useMobileControls } from '../contexts/MobileControlsContext'

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface SetlistSongInfo {
  songId: string
  key: string
  bpm: number | null
  notes: string | null
  itemId: string
  position?: number
}

interface SongViewerProps {
  song: Song
  onBack: () => void
  onEdit: () => void
  onSearch: () => void
  onAddSong: () => void
  onAddSetlist: () => void
  initialTranspose?: string | null
  bpmOverride?: number | null
  notes?: string | null
  setlistId?: string | null
  setlistItemId?: string | null
  setlistSongs?: SetlistSongInfo[]
  onNavigateToSong?: (songId: string, key: string, bpm: number | null, notes: string | null, itemId: string, allSongs?: SetlistSongInfo[], position?: number) => void
  onNotesUpdated?: (itemId: string, notes: string | null) => void
}

type AccidentalPreference = 'sharp' | 'flat'

const ChordLine = React.forwardRef<HTMLDivElement, {
  line: SongLine
  transpose: number
  preference: AccidentalPreference
  isFirstLine: boolean
}>(({ line, transpose, preference, isFirstLine }, ref) => {
  if (line.chords.length === 0 && !line.lyrics && !line.section) {
    return <div ref={ref} className="h-5" />
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
      <div className="text-accent font-bold whitespace-pre font-mono">
        {chordLine}
      </div>
    )
  }

  const sectionColor = line.section ? getSectionColor(line.section) : ''

  // Margin only for sections that are not the first line
  const needsTopMargin = line.section && !isFirstLine

  return (
    <div
      ref={ref}
      className={`leading-relaxed ${needsTopMargin ? 'mt-8' : ''}`}
    >
      {line.section && (
        <span
          className="inline-block px-3 py-1 rounded-lg text-xs uppercase tracking-wider font-medium mb-2"
          style={{
            color: sectionColor,
            backgroundColor: sectionColor.replace('hsl(', 'hsla(').replace(')', ', 0.15)')
          }}
        >
          {line.section}
        </span>
      )}
      {renderChords()}
      {line.lyrics && (
        <div className="whitespace-pre-wrap text-text-primary">{line.lyrics}</div>
      )}
    </div>
  )
})

ChordLine.displayName = 'ChordLine'

export function SongViewer({
  song,
  onBack,
  onEdit,
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
  const { isMinimized: isMobileControlsMinimized, toggle: toggleMobileControls } = useMobileControls()
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

  // Update state when setlist item changes (even if same song)
  useEffect(() => {
    setLocalNotes(notes || '')
    setNotesMinimized(!notes?.trim())
    // Recalculate transpose based on new key
    if (initialTranspose && song.originalKey) {
      setTranspose(getSemitonesBetweenKeys(song.originalKey, initialTranspose))
    } else {
      setTranspose(0)
    }
  }, [notes, song.id, song.originalKey, initialTranspose, setlistItemId])

  const currentKey = getKeyFromSemitones(song.originalKey, transpose, preference)

  // Auto-focus container on song entry
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true })
  }, [song.id])

  // Current position in setlist and navigation
  const currentPosition = setlistSongs?.findIndex(s => s.itemId === setlistItemId) ?? -1
  const canGoPrev = currentPosition > 0
  const canGoNext = currentPosition >= 0 && currentPosition < (setlistSongs?.length ?? 0) - 1

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!setlistSongs || !onNavigateToSong) return
    const newIndex = direction === 'prev' ? currentPosition - 1 : currentPosition + 1
    const targetSong = setlistSongs[newIndex]
    if (targetSong) {
      onNavigateToSong(targetSong.songId, targetSong.key, targetSong.bpm, targetSong.notes, targetSong.itemId, setlistSongs, newIndex)
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

  // Target position: 24px from container top (same as p-6 padding)
  const TARGET_OFFSET = 24

  // Scroll to section - positions ALL sections at the SAME exact pixel
  const handleNavigateToSection = useCallback((lineIndex: number) => {
    const sectionIdx = sectionIndices.indexOf(lineIndex)
    if (sectionIdx !== -1) {
      setCurrentSectionIndex(sectionIdx)
    }

    isNavigatingRef.current = true

    const container = contentRef.current
    const lineEl = lineRefs.current[lineIndex]

    if (container && lineEl) {
      // Use getBoundingClientRect for precise calculation
      const containerRect = container.getBoundingClientRect()
      const lineRect = lineEl.getBoundingClientRect()

      // Current element position relative to container + current scroll
      const lineTopRelative = lineRect.top - containerRect.top + container.scrollTop

      // Scroll so element is exactly at TARGET_OFFSET
      const scrollTop = lineTopRelative - TARGET_OFFSET
      container.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
    }

    setTimeout(() => {
      isNavigatingRef.current = false
    }, 500)
  }, [sectionIndices])

  // Track current section on scroll - with throttle via requestAnimationFrame
  useEffect(() => {
    const container = contentRef.current
    if (!container || sectionIndices.length === 0) return

    let rafId: number | null = null
    let lastActiveIndex = 0

    const updateSection = () => {
      rafId = null

      // Ignore during programmatic navigation
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

      // Only update state if changed (avoid unnecessary re-renders)
      if (activeIndex !== lastActiveIndex) {
        lastActiveIndex = activeIndex
        setCurrentSectionIndex(activeIndex)
      }
    }

    const handleScroll = () => {
      // Throttle: max 1 execution per frame (60fps)
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
    // Ignore if in input/textarea
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

  // Prepare setlistNav props for TopBar
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
      onSearch={onSearch}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
      onEdit={onEdit}
      setlistNav={setlistNav}
      bpm={bpmOverride || song.bpm}
      originalKey={song.originalKey}
    >
      {/* FloatingControls Desktop - hidden on mobile */}
      <div
        className="hidden lg:flex fixed z-40 left-1/2 justify-end pr-4"
        style={{ top: 'calc(3.5rem + 3rem)', marginLeft: 'calc(-28rem - 17rem)', width: '12rem' }}
      >
        <FloatingControls
          currentKey={currentKey}
          onTransposeDown={() => setTranspose(t => t - 1)}
          onTransposeUp={() => setTranspose(t => t + 1)}
          onKeySelect={handleSelectKey}
          onFontDecrease={() => setFontSize(s => Math.max(12, s - 2))}
          onFontIncrease={() => setFontSize(s => Math.min(32, s + 2))}
          youtubeUrl={song.youtubeUrl || undefined}
        />
      </div>

      {/* Section Minimap Desktop - hidden on mobile */}
      {sectionIndices.length > 0 && (
        <div
          className="hidden lg:flex fixed z-40 left-1/2 justify-end pr-4"
          style={{ top: 'calc(3.5rem + 3rem)', marginLeft: 'calc(-28rem - 5rem)', width: '4rem' }}
        >
          <SectionMinimap
            content={song.content}
            currentSection={currentSectionIndex}
            onNavigate={handleNavigateToSection}
          />
        </div>
      )}

      {/* FloatingControls Mobile - visible only on mobile */}
      <div className="lg:hidden fixed z-40 bottom-6 left-6">
        <FloatingControls
          currentKey={currentKey}
          onTransposeDown={() => setTranspose(t => t - 1)}
          onTransposeUp={() => setTranspose(t => t + 1)}
          onKeySelect={handleSelectKey}
          onFontDecrease={() => setFontSize(s => Math.max(12, s - 2))}
          onFontIncrease={() => setFontSize(s => Math.min(32, s + 2))}
          youtubeUrl={song.youtubeUrl || undefined}
          isMinimized={isMobileControlsMinimized}
          onToggleMinimized={toggleMobileControls}
        />
      </div>

      {/* Scrollable content */}
      <div
        ref={contentRef}
        tabIndex={0}
        className="flex-1 p-6 lg:p-8 overflow-auto outline-none scroll-smooth"
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
                isFirstLine={i === 0}
              />
            ))}
          </div>

          {/* Footer with date and author */}
          <div className="mt-16 pt-6 border-t border-border-subtle flex items-center gap-2 text-sm text-text-tertiary">
            <span>Criado em {formatDate(song.createdAt)}</span>
            {song.createdBy && (
              <>
                <span>por</span>
                <AuthorBadge userId={song.createdBy} size="md" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating notes panel - Desktop (when from a setlist) */}
      {setlistItemId && (
        <div
          className="hidden lg:block fixed z-40"
          style={{ top: '6rem', right: '2rem' }}
        >
          <NotesSidebar
            notes={localNotes}
            onSave={handleSaveNotes}
            minimized={notesMinimized}
            onToggleMinimized={() => setNotesMinimized(m => !m)}
          />
        </div>
      )}

      {/* Floating notes panel - Mobile (when from a setlist) */}
      {setlistItemId && (
        <div className="lg:hidden fixed z-40 bottom-6 right-6">
          <NotesSidebar
            notes={localNotes}
            onSave={handleSaveNotes}
            minimized={notesMinimized}
            onToggleMinimized={() => setNotesMinimized(m => !m)}
            position="bottom-right"
          />
        </div>
      )}
    </Layout>
  )
}
