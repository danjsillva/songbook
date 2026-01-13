import { useState, useEffect } from 'react'
import {
  Check,
  Trash2,
  Loader2,
} from 'lucide-react'
import { api } from '../api/client'
import { Layout } from './Layout'

interface SetlistFormProps {
  setlistId?: string
  onBack: () => void
  onSaved: (id: string) => void
  onDelete?: () => void
  onSearch: () => void
  onAddSong: () => void
  onAddSetlist: () => void
}

export function SetlistForm({
  setlistId,
  onBack,
  onSaved,
  onDelete,
  onSearch,
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

  const inputClasses = "w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-border-hover text-text-primary placeholder:text-text-muted transition-all duration-200"
  const labelClasses = "block text-sm font-medium text-text-secondary mb-2"

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

  return (
    <Layout
      title={isEditing ? 'Editar Setlist' : 'Novo Setlist'}
      onSearch={onSearch}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
      actions={
        <div className="flex items-center gap-2">
          {isEditing && onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 px-4 bg-danger-subtle hover:bg-danger-muted disabled:opacity-50 rounded-xl flex items-center gap-2 transition-all duration-200 text-sm font-medium cursor-pointer disabled:cursor-not-allowed text-danger"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="h-10 px-5 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-muted rounded-xl flex items-center gap-2 transition-all duration-200 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed text-bg-primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      }
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="max-w-md space-y-5">
              {error && (
                <div className="p-4 bg-danger-subtle border border-danger-muted rounded-xl text-danger">
                  {error}
                </div>
              )}

              <div>
                <label className={labelClasses}>Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Culto Domingo"
                  className={inputClasses}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelClasses}>Data *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
