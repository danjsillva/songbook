import { useState, useMemo, useEffect } from 'react'
import { api } from '../api/client'
import { parseContent } from '../utils/parser'
import { contentToText } from '../utils/contentToText'
import type { Song, SongLine } from '@songbook/shared'
import { Layout } from './Layout'

interface SongFormProps {
  song?: Song
  onBack: () => void
  onSaved: () => void
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
  paste: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  magic: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
}

function Preview({ lines }: { lines: SongLine[] }) {
  if (lines.length === 0) {
    return (
      <div className="text-neutral-500 text-center py-8">
        Cole a cifra para ver o preview
      </div>
    )
  }

  return (
    <div className="font-mono text-sm space-y-1">
      {lines.map((line, i) => (
        <div key={i}>
          {line.chords.length > 0 && (
            <div className="text-amber-400 font-bold whitespace-pre">
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
            <div className="whitespace-pre-wrap">{line.lyrics}</div>
          ) : line.chords.length === 0 ? (
            <div className="h-4" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function SongForm({
  song,
  onBack,
  onSaved,
  onDelete,
  onHome,
  onSearchSongs,
  onSearchSetlists,
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

  // ESC para voltar
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

      if (isEditing && song) {
        await api.songs.update(song.id, input)
      } else {
        await api.songs.create(input)
      }

      onSaved()
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
        {/* Header */}
        <div className="p-6 border-b border-neutral-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                {isEditing ? 'Editar Musica' : 'Adicionar Musica'}
              </h1>
              <button
                onClick={handlePaste}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                title="Colar cifra"
              >
                {Icons.paste}
              </button>
            </div>
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

        {/* Form */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Extração via URL - apenas no modo de adicionar */}
            {!isEditing && (
              <div className="p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                <label className="block text-sm text-neutral-400 mb-2">
                  Importar de URL (Cifra Club, etc)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={extractUrl}
                    onChange={(e) => setExtractUrl(e.target.value)}
                    placeholder="https://www.cifraclub.com.br/artista/musica/"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                    disabled={extracting}
                    onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                  />
                  <button
                    onClick={handleExtract}
                    disabled={!extractUrl.trim() || extracting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 rounded-lg flex items-center gap-2 transition-colors text-sm uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed"
                  >
                    {extracting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                        Extraindo...
                      </>
                    ) : (
                      <>
                        {Icons.magic}
                        Extrair
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Titulo *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Evidencias"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Artista *</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ex: Chitaozinho e Xororo"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Tom original</label>
                <input
                  type="text"
                  value={originalKey}
                  onChange={(e) => setOriginalKey(e.target.value)}
                  placeholder="Ex: G, Am"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="Ex: 120"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">YouTube</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500"
              />
            </div>

            {/* Editor + Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400">Cifra *</label>
                </div>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder={`Cole aqui a cifra copiada do Cifra Club ou similar...

Exemplo:
        G                 D
Quando eu digo que deixei de te amar
        Em               C
E porque eu te amo`}
                  className="w-full h-[calc(100vh-340px)] min-h-[300px] px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-neutral-500 font-mono text-sm resize-none"
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400">Preview</label>
                  {detectedChords.length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {detectedChords.map(chord => (
                        <span key={chord} className="px-2 py-0.5 bg-amber-900/50 text-amber-400 rounded text-xs font-mono">
                          {chord}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="h-[calc(100vh-340px)] min-h-[300px] overflow-auto p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
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
