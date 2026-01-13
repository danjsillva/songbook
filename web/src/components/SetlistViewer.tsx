import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Plus,
  Trash2,
  Pencil,
  X,
  GripVertical,
  MoreVertical,
  Loader2,
} from 'lucide-react'
import { api } from '../api/client'
import type { Setlist, SongListItem, SetlistSong, SongLine } from '@songbook/shared'
import { Layout, Badge } from './Layout'
import { SearchModal, type SetlistSongData } from './SearchModal'
import { parseContent } from '../utils/parser'
import { songCache } from '../cache/songCache'
import { AuthorBadge } from './AuthorBadge'
import {
  DndContext,
  closestCenter,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SetlistSongInfo {
  songId: string
  key: string
  bpm: number | null
  notes: string | null
  itemId: string
}

interface SetlistViewerProps {
  setlistId: string
  onBack: () => void
  onEdit: () => void
  onViewSong: (songId: string, key: string, bpm: number | null, notes: string | null, itemId: string, allSongs?: SetlistSongInfo[], position?: number) => void
  onSearch: () => void
  onAddSong: () => void
  onAddSetlist: () => void
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

interface EditItemModalProps {
  item: SetlistSong
  onClose: () => void
  onSave: (data: SetlistSongData) => void
}

function EditItemModal({ item, onClose, onSave }: EditItemModalProps) {
  const [key, setKey] = useState(item.key)
  const [bpm, setBpm] = useState(item.bpm?.toString() || '')
  const [notes, setNotes] = useState(item.notes || '')

  const parsedNotes = useMemo(() => {
    if (!notes.trim()) return []
    return parseContent(notes)
  }, [notes])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose])

  const handleSubmit = () => {
    if (!key.trim()) return
    onSave({
      key: key.trim(),
      bpm: bpm.trim() ? parseInt(bpm.trim(), 10) : undefined,
      notes: notes.trim() || undefined,
    })
  }

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
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Editar no Setlist</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-text-tertiary hover:text-text-primary rounded-xl hover:bg-surface cursor-pointer transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-lg text-text-primary">{item.song.title}</div>
              <div className="text-text-tertiary">{item.song.artist}</div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {item.song.bpm && <Badge size="sm">{item.song.bpm} bpm</Badge>}
              {item.song.originalKey && <Badge variant="accent" size="sm">{item.song.originalKey}</Badge>}
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
              onClick={onClose}
              className="flex-1 h-12 bg-surface hover:bg-surface-hover rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 text-text-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!key.trim()}
              className="flex-1 h-12 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-muted rounded-xl text-sm font-semibold cursor-pointer disabled:cursor-not-allowed transition-all duration-200 text-bg-primary"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SortableSongItemProps {
  item: SetlistSong
  index: number
  onViewSong: () => void
  onEdit: () => void
  onRemove: () => void
}

function SortableSongItem({ item, index, onViewSong, onEdit, onRemove }: SortableSongItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 py-4 px-4 -mx-4 rounded-2xl transition-all duration-200 ${
        isDragging ? 'opacity-50 bg-surface z-10' : 'hover:bg-surface/50'
      }`}
    >
      <span className="text-text-tertiary w-6 text-center flex-shrink-0 font-mono text-sm">
        {index + 1}
      </span>

      <button
        {...attributes}
        {...listeners}
        className="p-2 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing touch-none flex-shrink-0 transition-colors duration-200"
        title="Arrastar para reordenar"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <button
        onClick={onViewSong}
        className="flex-1 text-left cursor-pointer min-w-0"
      >
        <div className="font-medium text-text-primary truncate group-hover:text-accent transition-colors duration-200">
          {item.song.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-text-tertiary truncate">{item.song.artist}</span>
          <div className="flex gap-1.5 ml-auto flex-shrink-0">
            {item.notes && <Badge variant="teal" size="sm">N</Badge>}
            {item.bpm && <Badge size="sm">{item.bpm}</Badge>}
            <Badge variant="accent" size="sm">{item.key}</Badge>
          </div>
        </div>
      </button>

      {/* 3-dot menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer rounded-xl hover:bg-surface transition-all duration-200"
          title="Opcoes"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 bg-bg-elevated border border-border rounded-xl shadow-lg py-2 min-w-[160px] z-50 animate-scale-in">
            <button
              onClick={() => { setShowMenu(false); onEdit() }}
              className="w-full px-4 py-3 text-left hover:bg-surface text-sm cursor-pointer flex items-center gap-3 transition-colors duration-150"
            >
              <Pencil className="w-4 h-4 text-text-tertiary" />
              Editar
            </button>
            <button
              onClick={() => { setShowMenu(false); onRemove() }}
              className="w-full px-4 py-3 text-left hover:bg-surface text-sm cursor-pointer flex items-center gap-3 text-danger transition-colors duration-150"
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function SetlistViewer({
  setlistId,
  onBack,
  onEdit,
  onViewSong,
  onSearch,
  onAddSong,
  onAddSetlist
}: SetlistViewerProps) {
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SetlistSong | null>(null)

  // Mapping for quick navigation
  const songsInfo = useMemo<SetlistSongInfo[]>(() => {
    if (!setlist) return []
    return setlist.songs.map(s => ({
      songId: s.songId,
      key: s.key,
      bpm: s.bpm,
      notes: s.notes,
      itemId: s.id,
    }))
  }, [setlist])

  const loadSetlist = useCallback(async () => {
    try {
      const data = await api.setlists.get(setlistId)
      setSetlist(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [setlistId])

  useEffect(() => {
    loadSetlist()
  }, [loadSetlist])

  // Prefetch all setlist songs in background
  useEffect(() => {
    if (!setlist || setlist.songs.length === 0) return
    const songIds = setlist.songs.map(s => s.songId)
    songCache.prefetchSetlist(songIds)
  }, [setlist])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open
      if (showAddModal || editingItem) {
        if (e.key === 'Escape') {
          // ESC is handled by modals
        }
        return
      }

      switch (e.key) {
        case 'Escape':
          onBack()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (setlist) {
            const index = parseInt(e.key) - 1
            const item = setlist.songs[index]
            if (item) {
              onViewSong(item.songId, item.key, item.bpm, item.notes, item.id, songsInfo, index)
            }
          }
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, showAddModal, editingItem, setlist, onViewSong, songsInfo])

  const handleAddSongWithDetails = async (song: SongListItem, data: SetlistSongData) => {
    try {
      await api.setlists.addSong(setlistId, {
        songId: song.id,
        key: data.key,
        bpm: data.bpm,
        notes: data.notes,
      })
      setShowAddModal(false)
      loadSetlist()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao adicionar musica')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remover musica do setlist?')) return
    try {
      await api.setlists.removeItem(setlistId, itemId)
      loadSetlist()
    } catch (err) {
      console.error(err)
    }
  }

  // Sensors for drag and drop - delay on touch to not conflict with scroll
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!setlist || !over || active.id === over.id) return

    const oldIndex = setlist.songs.findIndex(s => s.id === active.id)
    const newIndex = setlist.songs.findIndex(s => s.id === over.id)
    const newOrder = arrayMove(setlist.songs, oldIndex, newIndex)

    // Optimistic update - update UI immediately
    setSetlist({ ...setlist, songs: newOrder })

    try {
      await api.setlists.reorder(setlistId, {
        itemIds: newOrder.map(s => s.id)
      })
    } catch (err) {
      console.error(err)
      // Rollback on error
      loadSetlist()
    }
  }

  const handleUpdateItem = async (data: SetlistSongData) => {
    if (!editingItem) return
    try {
      await api.setlists.updateItem(setlistId, editingItem.id, {
        key: data.key,
        bpm: data.bpm ?? null,
        notes: data.notes ?? null,
      })
      setEditingItem(null)
      loadSetlist()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar')
    }
  }

  if (loading) {
    return (
      <Layout title="Carregando..." onSearch={onSearch} onAddSong={onAddSong} onAddSetlist={onAddSetlist}>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <span className="text-text-tertiary text-sm">Carregando...</span>
          </div>
        </div>
      </Layout>
    )
  }

  if (!setlist) {
    return (
      <Layout title="Erro" onSearch={onSearch} onAddSong={onAddSong} onAddSetlist={onAddSetlist}>
        <div className="h-full flex items-center justify-center">
          <div className="text-text-tertiary">Setlist nao encontrado</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={setlist.name}
      subtitle={formatDate(setlist.date)}
      onSearch={onSearch}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
      onEdit={onEdit}
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-5 bg-accent hover:bg-accent-hover rounded-xl flex items-center gap-2 transition-all duration-200 text-sm font-semibold cursor-pointer text-bg-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      }
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {setlist.songs.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-text-tertiary" />
                </div>
                <p className="text-text-tertiary">
                  Nenhuma musica no setlist. Clique em Adicionar para comecar.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={setlist.songs.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {setlist.songs.map((item, index) => (
                      <SortableSongItem
                        key={item.id}
                        item={item}
                        index={index}
                        onViewSong={() => onViewSong(item.songId, item.key, item.bpm, item.notes, item.id, songsInfo, index)}
                        onEdit={() => setEditingItem(item)}
                        onRemove={() => handleRemoveItem(item.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Footer with date and author */}
            <div className="mt-12 pt-6 border-t border-border-subtle flex items-center gap-2 text-sm text-text-tertiary">
              <span>Criado em {formatTimestamp(setlist.createdAt)}</span>
              {setlist.createdBy && (
                <>
                  <span>por</span>
                  <AuthorBadge userId={setlist.createdBy} size="md" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <SearchModal
          type="songs"
          onClose={() => setShowAddModal(false)}
          onSelectSongWithDetails={handleAddSongWithDetails}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdateItem}
        />
      )}
    </Layout>
  )
}
