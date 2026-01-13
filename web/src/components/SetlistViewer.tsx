import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { api } from '../api/client'
import type { Setlist, SongListItem, SetlistSong, SongLine } from '@songbook/shared'
import { Layout } from './Layout'
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

const Icons = {
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  addToList: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  remove: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  editSmall: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  dragHandle: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
    </svg>
  ),
  moreVertical: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  ),
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

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 rounded-lg w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">Editar no Setlist</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 cursor-pointer"
          >
            {Icons.close}
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-lg text-neutral-100">{item.song.title}</div>
              <div className="text-neutral-400">{item.song.artist}</div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {item.song.bpm && (
                <span className="px-2.5 py-0.5 bg-neutral-700 text-neutral-300 rounded-full text-sm font-mono">
                  {item.song.bpm}bpm
                </span>
              )}
              {item.song.originalKey && (
                <span className="px-2.5 py-0.5 bg-amber-900/50 text-amber-400 rounded-full text-sm font-mono">
                  {item.song.originalKey}
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
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-full text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!key.trim()}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 rounded-full text-sm cursor-pointer disabled:cursor-not-allowed"
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

  // Fechar menu ao clicar fora
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
      className={`flex items-center gap-2 py-3 hover:bg-neutral-800 -mx-4 px-4 rounded-lg transition-colors ${
        isDragging ? 'opacity-50 bg-neutral-800 z-10' : ''
      }`}
    >
      <span className="text-neutral-500 w-6 text-center flex-shrink-0">{index + 1}</span>

      <button
        {...attributes}
        {...listeners}
        className="p-2 text-neutral-400 hover:text-white cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        title="Arrastar para reordenar"
      >
        {Icons.dragHandle}
      </button>

      <button
        onClick={onViewSong}
        className="flex-1 text-left ml-1 cursor-pointer min-w-0"
      >
        <div className="font-medium truncate">{item.song.title}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-neutral-400">{item.song.artist}</span>
          <div className="flex gap-1 ml-auto">
            {item.notes && (
              <span className="px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 rounded-full text-xs">
                N
              </span>
            )}
            {item.bpm && (
              <span className="px-1.5 py-0.5 bg-neutral-700 text-neutral-300 rounded-full text-xs font-mono">
                {item.bpm}
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-amber-900/50 text-amber-400 rounded-full text-xs font-mono">
              {item.key}
            </span>
          </div>
        </div>
      </button>

      {/* Menu de 3 pontinhos */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-neutral-400 hover:text-white cursor-pointer rounded-full hover:bg-neutral-700"
          title="Opcoes"
        >
          {Icons.moreVertical}
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-neutral-800 rounded-lg shadow-lg py-1 min-w-[140px] z-50 border border-neutral-700">
            <button
              onClick={() => { setShowMenu(false); onEdit() }}
              className="w-full px-3 py-2 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-2"
            >
              {Icons.editSmall}
              Editar
            </button>
            <button
              onClick={() => { setShowMenu(false); onRemove() }}
              className="w-full px-3 py-2 text-left hover:bg-neutral-700 text-sm cursor-pointer flex items-center gap-2 text-red-400"
            >
              {Icons.remove}
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

  // Mapeamento para navegação rápida
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

  // Prefetch de todas as músicas do setlist em background
  // Limpa cache anterior (1 setlist por vez = memória controlada)
  // Quando o usuário navegar, a música já estará no cache = ZERO loading
  useEffect(() => {
    if (!setlist || setlist.songs.length === 0) return
    const songIds = setlist.songs.map(s => s.songId)
    songCache.prefetchSetlist(songIds)
  }, [setlist])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se modal estiver aberto
      if (showAddModal || editingItem) {
        if (e.key === 'Escape') {
          // ESC é tratado pelos modais
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

  // Sensors para drag and drop - delay no touch para não conflitar com scroll
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

    // Optimistic update - atualiza UI imediatamente
    setSetlist({ ...setlist, songs: newOrder })

    try {
      await api.setlists.reorder(setlistId, {
        itemIds: newOrder.map(s => s.id)
      })
    } catch (err) {
      console.error(err)
      // Rollback em caso de erro
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
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!setlist) {
    return (
      <Layout title="Erro" onSearch={onSearch} onAddSong={onAddSong} onAddSetlist={onAddSetlist}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Setlist nao encontrado</div>
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
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-full flex items-center gap-2 transition-colors text-sm cursor-pointer"
        >
          {Icons.addToList}
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      }
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            {setlist.songs.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                Nenhuma musica no setlist. Clique em + para adicionar.
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

            {/* Rodapé com data e autor */}
            <div className="mt-8 pt-4 border-t border-neutral-800 flex items-center gap-2 text-sm text-neutral-500">
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
