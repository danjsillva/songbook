import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Check,
  Trash2,
  Clipboard,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { api } from '../api/client'
import { parseContent } from '../utils/parser'
import { contentToText } from '../utils/contentToText'
import type { Song, SongLine } from '@songbook/shared'
import { getSectionColor } from '@songbook/shared'
import { Layout } from './Layout'

interface SongFormProps {
  song?: Song
  onBack: () => void
  onSaved: (id: string) => void
  onDelete?: () => void
  onSearch: () => void
  onAddSong: () => void
  onAddSetlist: () => void
}

function Preview({ lines }: { lines: SongLine[] }) {
  if (lines.length === 0) {
    return (
      <div className="text-text-tertiary text-center py-8">
        Cole a cifra para ver o preview
      </div>
    )
  }

  return (
    <div className="font-mono text-sm space-y-1">
      {lines.map((line, i) => {
        const sectionColor = line.section ? getSectionColor(line.section) : ''

        return (
          <div key={i}>
            {line.section && (
              <span
                className="inline-block px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider font-medium mb-1"
                style={{
                  color: sectionColor,
                  backgroundColor: sectionColor.replace('hsl(', 'hsla(').replace(')', ', 0.15)')
                }}
              >
                {line.section}
              </span>
            )}
            {line.chords.length > 0 && (
              <div className="text-accent font-bold whitespace-pre">
                {line.chords.map((c, j) => {
                  const prevEnd = j > 0
                    ? line.chords[j-1].position + line.chords[j-1].chord.length
                    : 0
                  const spaces = Math.max(0, c.position - prevEnd)
                  return ' '.repeat(spaces) + c.chord
                }).join('')}
              </div>
            )}
            {line.lyrics ? (
              <div className="whitespace-pre-wrap text-text-primary">{line.lyrics}</div>
            ) : line.chords.length === 0 ? (
              <div className="h-4" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function SongForm({
  song,
  onBack,
  onSaved,
  onDelete,
  onSearch,
  onAddSong,
  onAddSetlist
}: SongFormProps) {
  const isEditing = !!song

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [originalKey, setOriginalKey] = useState('')
  const [bpm, setBpm] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [html, setHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractUrl, setExtractUrl] = useState('')
  const [extracting, setExtracting] = useState(false)

  // Refs for scroll sync
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef<'editor' | 'preview' | null>(null)

  // Scroll sync between editor and preview
  const handleEditorScroll = useCallback(() => {
    if (isScrollingRef.current === 'preview') return
    isScrollingRef.current = 'editor'

    const editor = editorRef.current
    const preview = previewRef.current
    if (!editor || !preview) return

    const editorScrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1)
    preview.scrollTop = editorScrollRatio * (preview.scrollHeight - preview.clientHeight)

    requestAnimationFrame(() => {
      isScrollingRef.current = null
    })
  }, [])

  const handlePreviewScroll = useCallback(() => {
    if (isScrollingRef.current === 'editor') return
    isScrollingRef.current = 'preview'

    const editor = editorRef.current
    const preview = previewRef.current
    if (!editor || !preview) return

    const previewScrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1)
    editor.scrollTop = previewScrollRatio * (editor.scrollHeight - editor.clientHeight)

    requestAnimationFrame(() => {
      isScrollingRef.current = null
    })
  }, [])

  useEffect(() => {
    if (song) {
      setTitle(song.title)
      setArtist(song.artist)
      setOriginalKey(song.originalKey || '')
      setBpm(song.bpm?.toString() || '')
      setYoutubeUrl(song.youtubeUrl || '')
      setHtml(contentToText(song.content))
    }
  }, [song])

  // ESC to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const parsedLines = useMemo(() => {
    if (!html.trim()) return []
    return parseContent(html)
  }, [html])

  const detectedChords = useMemo(() => {
    const chords = new Set<string>()
    parsedLines.forEach(line => line.chords.forEach(c => chords.add(c.chord)))
    return Array.from(chords).slice(0, 8)
  }, [parsedLines])

  const canSave = title.trim() && artist.trim() && html.trim()

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setHtml(text)
    } catch {
      // Fallback
    }
  }

  const handleExtract = async () => {
    if (!extractUrl.trim()) return

    try {
      setExtracting(true)
      setError(null)

      const data = await api.extract({ url: extractUrl.trim() })

      setTitle(data.title || '')
      setArtist(data.artist || '')
      setOriginalKey(data.originalKey || '')
      setHtml(data.lyrics || '')

      setExtractUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao extrair dados da URL')
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async () => {
    if (!canSave) return

    try {
      setSaving(true)
      setError(null)

      const input = {
        title: title.trim(),
        artist: artist.trim(),
        originalKey: originalKey.trim() || undefined,
        bpm: bpm.trim() ? parseInt(bpm.trim(), 10) : undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        html: html.trim(),
      }

      let songId: string
      if (isEditing && song) {
        await api.songs.update(song.id, input)
        songId = song.id
      } else {
        const created = await api.songs.create(input)
        songId = created.id
      }

      onSaved(songId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!song || !onDelete) return
    if (!confirm('Tem certeza que deseja excluir esta musica?')) return

    try {
      setDeleting(true)
      setError(null)
      await api.songs.delete(song.id)
      onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  const inputClasses = "w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-border-hover text-text-primary placeholder:text-text-muted transition-all duration-200"
  const labelClasses = "block text-sm font-medium text-text-secondary mb-2"

  return (
    <Layout
      title={isEditing ? 'Editar Musica' : 'Nova Musica'}
      onSearch={onSearch}
      onAddSong={onAddSong}
      onAddSetlist={onAddSetlist}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handlePaste}
            className="h-10 px-4 bg-surface hover:bg-surface-hover rounded-xl flex items-center gap-2 transition-all duration-200 text-sm font-medium cursor-pointer text-text-secondary hover:text-text-primary"
          >
            <Clipboard className="w-4 h-4" />
            <span className="hidden sm:inline">Colar</span>
          </button>
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
            className="h-10 px-5 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-muted rounded-xl flex items-center gap-2 transition-all duration-200 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed text-bg-primary disabled:text-text-muted"
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
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="p-4 bg-danger-subtle border border-danger-muted rounded-xl text-danger">
                {error}
              </div>
            )}

            {/* URL extraction - only in add mode */}
            {!isEditing && (
              <div className="p-5 bg-bg-secondary border border-border-subtle rounded-2xl">
                <label className={labelClasses}>
                  Importar de URL (Cifra Club, etc)
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={extractUrl}
                    onChange={(e) => setExtractUrl(e.target.value)}
                    placeholder="https://www.cifraclub.com.br/artista/musica/"
                    className={`flex-1 ${inputClasses}`}
                    disabled={extracting}
                    onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                  />
                  <button
                    onClick={handleExtract}
                    disabled={!extractUrl.trim() || extracting}
                    className="h-[50px] px-5 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-muted rounded-xl flex items-center gap-2 transition-all duration-200 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed text-bg-primary"
                  >
                    {extracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{extracting ? 'Extraindo...' : 'Extrair'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className={labelClasses}>Titulo *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Evidencias"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Artista *</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ex: Chitaozinho e Xororo"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Tom original</label>
                <input
                  type="text"
                  value={originalKey}
                  onChange={(e) => setOriginalKey(e.target.value)}
                  placeholder="Ex: G, Am"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>BPM</label>
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
              <label className={labelClasses}>YouTube</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={inputClasses}
              />
            </div>

            {/* Editor + Preview */}
            <div className="space-y-5">
              {/* Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelClasses.replace('mb-2', '')}>Cifra *</label>
                </div>
                <textarea
                  ref={editorRef}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  onScroll={handleEditorScroll}
                  placeholder={`Cole aqui a cifra copiada do Cifra Club ou similar...

Exemplo:
        G                 D
Quando eu digo que deixei de te amar
        Em               C
E porque eu te amo`}
                  className={`${inputClasses} h-64 font-mono text-sm resize-none`}
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelClasses.replace('mb-2', '')}>Preview</label>
                  {detectedChords.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {detectedChords.map(chord => (
                        <span key={chord} className="px-2.5 py-1 bg-accent-subtle text-accent rounded-lg text-xs font-mono font-medium">
                          {chord}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  ref={previewRef}
                  onScroll={handlePreviewScroll}
                  className="h-64 overflow-auto p-4 bg-surface border border-border rounded-xl"
                >
                  <Preview lines={parsedLines} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
