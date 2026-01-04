import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Layout } from './Layout'

interface SetlistFormProps {
  setlistId?: string
  onBack: () => void
  onSaved: (id: string) => void
  onDelete?: () => void
  onHome: () => void
  onSearchSongs: () => void
  onSearchSetlists: () => void
  onAddSong: () => void
  onAddSetlist: () => void
}

const Icons = {
  save: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  delete: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
}

export function SetlistForm({
  setlistId,
  onBack,
  onSaved,
  onDelete,
  onHome,
  onSearchSongs,
  onSearchSetlists,
  onAddSong,
  onAddSetlist
}: SetlistFormProps) {
  const isEditing = !!setlistId

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(!!setlistId)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (setlistId) {
      setLoading(true)
      api.setlists.get(setlistId).then((data) => {
        setName(data.name)
        setDate(data.date)
        setLoading(false)
      }).catch(() => {
        setError('Erro ao carregar setlist')
        setLoading(false)
      })
    } else {
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [setlistId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const canSave = name.trim() && date.trim()

  const handleSave = async () => {
    if (!canSave) return

    try {
      setSaving(true)
      setError(null)

      if (isEditing && setlistId) {
        await api.setlists.update(setlistId, {
          name: name.trim(),
          date: date.trim(),
        })
        onSaved(setlistId)
      } else {
        const created = await api.setlists.create({
          name: name.trim(),
          date: date.trim(),
        })
        onSaved(created.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!setlistId || !onDelete) return
    if (!confirm('Tem certeza que deseja excluir este setlist?')) return

    try {
      setDeleting(true)
      setError(null)
      await api.setlists.delete(setlistId)
      onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setDeleting(false)
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

  return (
    <Layout
      onHome={onHome}
      onSearchSongs={onSearchSongs}
      onSearchSetlists={onSearchSetlists}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
      backButton={{ onClick: onBack }}
    >
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-800">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              {isEditing ? 'Editar Setlist' : 'Novo Setlist'}
            </h1>
            <div className="flex items-center gap-2">
              {isEditing && onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-colors text-sm uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    Icons.delete
                  )}
                  Excluir
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 rounded-lg flex items-center gap-2 transition-colors text-sm uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                ) : (
                  Icons.save
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="max-w-md space-y-4">
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Culto Domingo"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Data *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
