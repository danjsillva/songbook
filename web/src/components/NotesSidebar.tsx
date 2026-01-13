import { useState, useMemo, useEffect, useRef } from 'react'
import {
  X,
  FileText,
  Pencil,
  Check,
} from 'lucide-react'
import type { SongLine } from '@songbook/shared'
import { parseContent } from '../utils/parser'

interface NotesSidebarProps {
  notes: string
  onSave?: (notes: string) => void
  minimized?: boolean
  onToggleMinimized?: () => void
  position?: 'top-right' | 'bottom-right'
}

function ChordLine({ line }: { line: SongLine }) {
  if (line.chords.length === 0 && !line.lyrics) {
    return <div className="h-3" />
  }

  const renderChords = () => {
    if (line.chords.length === 0) return null

    let chordLine = ''
    let lastEnd = 0

    for (const { chord, position } of line.chords) {
      const spaces = Math.max(0, position - lastEnd)
      chordLine += ' '.repeat(spaces) + chord
      lastEnd = position + chord.length
    }

    return (
      <div className="text-accent font-bold whitespace-pre font-mono text-sm">
        {chordLine}
      </div>
    )
  }

  return (
    <div className="leading-relaxed">
      {renderChords()}
      {line.lyrics && (
        <div className="whitespace-pre-wrap text-sm text-text-primary">{line.lyrics}</div>
      )}
    </div>
  )
}

export function NotesSidebar({ notes, onSave, minimized, onToggleMinimized, position = 'top-right' }: NotesSidebarProps) {
  // Internal minimized state (used if not externally controlled)
  const [internalMinimized, setInternalMinimized] = useState(!notes.trim())
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(notes)
  const [hasChanges, setHasChanges] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Use external state if provided, otherwise use internal
  const isMinimized = minimized !== undefined ? minimized : internalMinimized
  const toggleMinimized = onToggleMinimized || (() => setInternalMinimized(m => !m))


  // Update when notes change (new song)
  useEffect(() => {
    setEditedNotes(notes)
    setHasChanges(false)
    setIsEditing(false)
    // Minimized if no notes, open if has notes (only for internal state)
    if (minimized === undefined) {
      setInternalMinimized(!notes.trim())
    }
  }, [notes, minimized])

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const parsedLines = useMemo(() => {
    if (!editedNotes.trim()) return []
    return parseContent(editedNotes)
  }, [editedNotes])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (onSave && hasChanges) {
      onSave(editedNotes)
      setHasChanges(false)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedNotes(notes)
    setHasChanges(false)
    setIsEditing(false)
  }

  const handleChange = (value: string) => {
    setEditedNotes(value)
    setHasChanges(value !== notes)
  }

  const isBottom = position === 'bottom-right'

  const panelContent = (
    <div
      className={`w-80 bg-bg-elevated border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden animate-scale-in ${
        isBottom ? 'absolute bottom-full right-0 mb-3' : 'mt-3'
      }`}
      style={{ maxHeight: isBottom ? 'calc(100vh - 12rem)' : 'calc(100vh - 9rem)' }}
    >
      {/* Toolbar - always at top */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-medium text-text-primary">Notas</span>
        <div className="flex items-center gap-1">
          {onSave && !isEditing && (
            <button
              onClick={handleEdit}
              className="w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface cursor-pointer transition-all duration-200"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                className="w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface cursor-pointer transition-all duration-200"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="w-8 h-8 flex items-center justify-center text-teal hover:text-teal disabled:text-text-muted disabled:opacity-50 rounded-lg hover:bg-surface disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
                title="Salvar"
              >
                <Check className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-auto p-4 min-h-0 ${isEditing ? 'min-h-64' : ''}`}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editedNotes}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-full min-h-56 bg-surface border border-border rounded-xl p-3 text-sm font-mono resize-none focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-border-hover transition-all duration-200"
            placeholder="Adicione suas notas aqui...

Exemplo:
G  D  Em  C
Intro com fingerstyle"
          />
        ) : (
          <div className="font-mono space-y-0.5">
            {parsedLines.length === 0 ? (
              <div className="text-text-tertiary text-sm">
                {onSave ? 'Clique em editar para adicionar notas' : 'Sem notas'}
              </div>
            ) : (
              parsedLines.map((line, i) => (
                <ChordLine key={i} line={line} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && !isEditing && (
        <div className="px-4 py-2 bg-accent-subtle/50 border-t border-accent-subtle text-accent text-xs flex-shrink-0 font-medium">
          Alteracoes nao salvas
        </div>
      )}
    </div>
  )

  const toggleButton = (
    <button
      onClick={toggleMinimized}
      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer border border-border ${
        isMinimized
          ? 'bg-teal hover:bg-teal/90 text-bg-primary'
          : 'bg-surface-active hover:bg-surface text-text-secondary'
      }`}
      title={isMinimized ? "Expandir notas (n)" : "Fechar notas (n)"}
    >
      {isMinimized ? <FileText className="w-5 h-5" /> : <X className="w-5 h-5" />}
    </button>
  )

  // Mobile (bottom-right): button at bottom, popup above
  if (isBottom) {
    return (
      <div className="relative">
        {!isMinimized && panelContent}
        {toggleButton}
      </div>
    )
  }

  // Desktop (top-right): button at top, popup below
  return (
    <div className="flex flex-col items-end">
      {toggleButton}
      {!isMinimized && panelContent}
    </div>
  )
}
