import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../api/client'
import type { Setlist, SongListItem, SetlistSong, SongLine } from '@songbook/shared'
import { Layout } from './Layout'
import { SearchModal, type SetlistSongData } from './SearchModal'
import { parseContent } from '../utils/parser'

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
  onViewSong: (songId: string, key: string, bpm: number | null, notes: string | null, itemId: string, allSongs?: SetlistSongInfo[]) => void
  onHome: () => void
  onSearchSongs: () => void
  onSearchSetlists: () => void
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
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
                <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono">
                  {item.song.bpm}
                </span>
              )}
              {item.song.originalKey && (
                <span className="px-2 py-1 bg-amber-900/50 text-amber-400 rounded text-sm font-mono">
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
              className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm uppercase tracking-wide cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!key.trim()}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 rounded-lg text-sm uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SetlistViewer({
  setlistId,
  onBack,
  onEdit,
  onViewSong,
  onHome,
  onSearchSongs,
  onSearchSetlists,
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
              onViewSong(item.songId, item.key, item.bpm, item.notes, item.id, songsInfo)
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

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!setlist) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= setlist.songs.length) return

    // Criar nova ordem
    const newOrder = [...setlist.songs]
    const [item] = newOrder.splice(index, 1)
    newOrder.splice(newIndex, 0, item)

    try {
      await api.setlists.reorder(setlistId, {
        itemIds: newOrder.map(s => s.id)
      })
      loadSetlist()
    } catch (err) {
      console.error(err)
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
      <Layout onHome={onHome} onSearchSongs={onSearchSongs} onSearchSetlists={onSearchSetlists} onAddSong={onAddSong} onAddSetlist={onAddSetlist}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Carregando...</div>
        </div>
      </Layout>
    )
  }

  if (!setlist) {
    return (
      <Layout onHome={onHome} onSearchSongs={onSearchSongs} onSearchSetlists={onSearchSetlists} onAddSong={onAddSong} onAddSetlist={onAddSetlist}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-neutral-400">Setlist nao encontrado</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      onHome={onHome}
      onSearchSongs={onSearchSongs}
      onSearchSetlists={onSearchSetlists}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
    >
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-800">
          <div className="max-w-4xl mx-auto flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{setlist.name}</h1>
                <button
                  onClick={onEdit}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                  title="Editar"
                >
                  {Icons.edit}
                </button>
              </div>
              <p className="text-neutral-400">{formatDate(setlist.date)}</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg flex items-center gap-2 transition-colors text-sm uppercase tracking-wide cursor-pointer"
            >
              {Icons.addToList}
              Adicionar Musica
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {setlist.songs.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                Nenhuma musica no setlist. Clique em + para adicionar.
              </div>
            ) : (
              <div className="space-y-1">
                {setlist.songs.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 py-4 hover:bg-neutral-800 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <span className="text-neutral-500 w-6 text-center">{index + 1}</span>

                    <div className="flex flex-col -my-2">
                      <button
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-neutral-600 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        {Icons.arrowUp}
                      </button>
                      <button
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === setlist.songs.length - 1}
                        className="p-0.5 text-neutral-600 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        {Icons.arrowDown}
                      </button>
                    </div>

                    <button
                      onClick={() => onViewSong(item.songId, item.key, item.bpm, item.notes, item.id, songsInfo)}
                      className="flex-1 text-left ml-2 cursor-pointer"
                    >
                      <div className="font-medium">{item.song.title}</div>
                      <div className="text-sm text-neutral-400">{item.song.artist}</div>
                    </button>

                    <div className="flex gap-1 flex-shrink-0">
                      {item.notes ? (
                        <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded text-sm font-mono">
                          Notas
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-neutral-800 text-neutral-600 rounded text-sm font-mono">
                          Notas
                        </span>
                      )}
                      {item.bpm && (
                        <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono">
                          {item.bpm}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-amber-900/50 text-amber-400 rounded text-sm font-mono">
                        {item.key}
                      </span>
                    </div>

                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-neutral-500 hover:text-white cursor-pointer"
                      title="Editar"
                    >
                      {Icons.editSmall}
                    </button>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 cursor-pointer"
                      title="Remover"
                    >
                      {Icons.remove}
                    </button>
                  </div>
                ))}
              </div>
            )}
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
