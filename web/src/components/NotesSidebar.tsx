import { useState, useMemo, useEffect, useRef } from 'react'
import type { SongLine } from '@songbook/shared'
import { parseContent } from '../utils/parser'

interface NotesSidebarProps {
  notes: string
  onSave?: (notes: string) => void
  minimized?: boolean
  onToggleMinimized?: () => void
  position?: 'top-right' | 'bottom-right'
}

const Icons = {
  close: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  expand: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  save: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  cancel: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
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
      <div className="text-amber-400 font-bold whitespace-pre font-mono text-sm">
        {chordLine}
      </div>
    )
  }

  return (
    <div className="leading-relaxed">
      {renderChords()}
      {line.lyrics && (
        <div className="whitespace-pre-wrap text-sm">{line.lyrics}</div>
      )}
    </div>
  )
}

export function NotesSidebar({ notes, onSave, minimized, onToggleMinimized, position = 'top-right' }: NotesSidebarProps) {
  // Estado interno de minimizado (usado se não for controlado externamente)
  const [internalMinimized, setInternalMinimized] = useState(!notes.trim())
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(notes)
  const [hasChanges, setHasChanges] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Usa estado externo se fornecido, senão usa interno
  const isMinimized = minimized !== undefined ? minimized : internalMinimized
  const toggleMinimized = onToggleMinimized || (() => setInternalMinimized(m => !m))


  // Atualizar quando notes muda (nova musica)
  useEffect(() => {
    setEditedNotes(notes)
    setHasChanges(false)
    setIsEditing(false)
    // Minimizada se não tem notas, aberta se tem (só para estado interno)
    if (minimized === undefined) {
      setInternalMinimized(!notes.trim())
    }
  }, [notes, minimized])

  // Focar no textarea ao entrar em modo edicao
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
      className={`w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl flex flex-col overflow-hidden ${
        isBottom ? 'absolute bottom-full right-0 mb-3' : 'mt-3'
      }`}
      style={{ maxHeight: isBottom ? 'calc(100vh - 12rem)' : 'calc(100vh - 9rem)' }}
    >
      {/* Toolbar - sempre no topo */}
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-medium text-neutral-300">Notas</span>
        <div className="flex items-center gap-0.5">
          {onSave && !isEditing && (
            <button
              onClick={handleEdit}
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 cursor-pointer"
              title="Editar"
            >
              {Icons.edit}
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 cursor-pointer"
                title="Cancelar"
              >
                {Icons.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="p-1.5 text-amber-400 hover:text-amber-300 disabled:text-neutral-500 disabled:opacity-50 rounded-full hover:bg-neutral-800 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Salvar"
              >
                {Icons.save}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conteudo */}
      <div className={`flex-1 overflow-auto p-3 min-h-0 ${isEditing ? 'min-h-64' : ''}`}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editedNotes}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-full min-h-56 bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-sm font-mono resize-none focus:outline-none focus:border-neutral-600"
            placeholder="Adicione suas notas aqui...

Exemplo:
G  D  Em  C
Intro com fingerstyle"
          />
        ) : (
          <div className="font-mono space-y-0.5">
            {parsedLines.length === 0 ? (
              <div className="text-neutral-500 text-sm">
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

      {/* Status de alteracoes */}
      {hasChanges && !isEditing && (
        <div className="px-3 py-1.5 bg-amber-900/20 border-t border-amber-900/30 text-amber-200 text-xs flex-shrink-0">
          Alteracoes nao salvas
        </div>
      )}
    </div>
  )

  const toggleButton = (
    <button
      onClick={toggleMinimized}
      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer ${
        isMinimized
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
      }`}
      title={isMinimized ? "Expandir notas (n)" : "Fechar notas (n)"}
    >
      {isMinimized ? Icons.expand : Icons.close}
    </button>
  )

  // Mobile (bottom-right): botão embaixo, popup acima
  if (isBottom) {
    return (
      <div className="relative">
        {!isMinimized && panelContent}
        {toggleButton}
      </div>
    )
  }

  // Desktop (top-right): botão em cima, popup abaixo
  return (
    <div className="flex flex-col items-end">
      {toggleButton}
      {!isMinimized && panelContent}
    </div>
  )
}
