import { nanoid } from 'nanoid'
import { parseHtmlToSongLines, generatePlainText, detectKey } from '../parser'
import { classifySongSections } from '../groq'
import { json, error } from '../lib/response'
import { requireWorkspace } from '../middleware/auth'
import type { Env, SongRow, SongListRow, WorkspaceContext } from '../lib/types'
import type { Song, SongListItem, CreateSongInput } from '@songbook/shared'

// Helper to map row to SongListItem
function toSongListItem(row: SongListRow): SongListItem {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.original_key,
    bpm: row.bpm,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

// Helper to map row to Song
function toSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.original_key,
    bpm: row.bpm,
    youtubeUrl: row.youtube_url,
    content: JSON.parse(row.content),
    plainText: row.plain_text,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

// GET /api/songs/recent - 5 most recently viewed songs
export async function getRecentSongs(request: Request, env: Env): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare(`
      SELECT id, title, artist, original_key, bpm, created_at, created_by
      FROM songs
      WHERE workspace_id = ? AND last_viewed_at IS NOT NULL
      ORDER BY last_viewed_at DESC
      LIMIT 5
    `)
    .bind(ctx.workspaceId)
    .all<SongListRow>()

  return json(result.results.map(toSongListItem))
}

// PUT /api/songs/:id/view - Mark song as viewed
export async function markSongViewed(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare('UPDATE songs SET last_viewed_at = ? WHERE id = ? AND workspace_id = ?')
    .bind(Date.now(), id, ctx.workspaceId)
    .run()

  if (result.meta.changes === 0) {
    return error('Song not found', 404)
  }

  return json({ success: true })
}

// GET /api/songs - List all songs
export async function listSongs(request: Request, env: Env): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare(`
      SELECT id, title, artist, original_key, bpm, created_at, created_by
      FROM songs
      WHERE workspace_id = ?
      ORDER BY created_at DESC
    `)
    .bind(ctx.workspaceId)
    .all<SongListRow>()

  return json(result.results.map(toSongListItem))
}

// GET /api/songs/:id - Get a song
export async function getSong(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const row = await env.DB
    .prepare('SELECT * FROM songs WHERE id = ? AND workspace_id = ?')
    .bind(id, ctx.workspaceId)
    .first<SongRow>()

  if (!row) {
    return error('Song not found', 404)
  }

  return json(toSong(row))
}

// POST /api/songs - Create a song
export async function createSong(request: Request, env: Env): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const input = await request.json<CreateSongInput>()
  if (!input.title || !input.artist || !input.html) {
    return error('Missing required fields: title, artist, html')
  }

  const id = nanoid(10)
  const content = parseHtmlToSongLines(input.html)
  const plainText = generatePlainText(content)
  const originalKey = input.originalKey || detectKey(content)
  const bpm = input.bpm || null
  const youtubeUrl = input.youtubeUrl || null
  const createdAt = Date.now()
  const createdBy = ctx.userId === 'anonymous' ? null : ctx.userId

  await env.DB
    .prepare(`
      INSERT INTO songs (id, workspace_id, title, artist, original_key, bpm, youtube_url, content, plain_text, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(id, ctx.workspaceId, input.title, input.artist, originalKey, bpm, youtubeUrl, JSON.stringify(content), plainText, createdAt, createdBy)
    .run()

  const song: Song = {
    id,
    title: input.title,
    artist: input.artist,
    originalKey,
    bpm,
    youtubeUrl,
    content,
    plainText,
    createdAt,
    createdBy,
  }

  return json(song, 201)
}

// PUT /api/songs/:id - Update a song
export async function updateSong(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const input = await request.json<CreateSongInput>()
  if (!input.title || !input.artist || !input.html) {
    return error('Missing required fields: title, artist, html')
  }

  const content = parseHtmlToSongLines(input.html)
  const plainText = generatePlainText(content)
  const originalKey = input.originalKey || detectKey(content)
  const bpm = input.bpm || null
  const youtubeUrl = input.youtubeUrl || null

  const result = await env.DB
    .prepare(`
      UPDATE songs
      SET title = ?, artist = ?, original_key = ?, bpm = ?, youtube_url = ?, content = ?, plain_text = ?
      WHERE id = ? AND workspace_id = ?
    `)
    .bind(input.title, input.artist, originalKey, bpm, youtubeUrl, JSON.stringify(content), plainText, id, ctx.workspaceId)
    .run()

  if (result.meta.changes === 0) {
    return error('Song not found', 404)
  }

  return getSong(request, env, id)
}

// DELETE /api/songs/:id - Delete a song
export async function deleteSong(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare('DELETE FROM songs WHERE id = ? AND workspace_id = ?')
    .bind(id, ctx.workspaceId)
    .run()

  if (result.meta.changes === 0) {
    return error('Song not found', 404)
  }

  return json({ success: true })
}

// POST /api/songs/:id/classify - Classify song sections using AI
export async function classifySong(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  if (!env.GROQ_API_KEY) {
    return error('GROQ_API_KEY not configured', 500)
  }

  const row = await env.DB
    .prepare('SELECT * FROM songs WHERE id = ? AND workspace_id = ?')
    .bind(id, ctx.workspaceId)
    .first<SongRow>()

  if (!row) {
    return error('Song not found', 404)
  }

  // Generate text with chords for classification
  const existingContent = JSON.parse(row.content) as Array<{ lyrics: string; chords: Array<{ chord: string; position: number }> }>

  let lyricsWithChords = ''
  for (const line of existingContent) {
    if (line.chords.length > 0) {
      let chordLine = ''
      for (const { chord, position } of line.chords) {
        while (chordLine.length < position) {
          chordLine += ' '
        }
        chordLine += chord
      }
      lyricsWithChords += chordLine + '\n'
    }
    lyricsWithChords += line.lyrics + '\n'
  }

  const classifiedLyrics = await classifySongSections(lyricsWithChords, env.GROQ_API_KEY)
  const newContent = parseHtmlToSongLines(classifiedLyrics)
  const newPlainText = generatePlainText(newContent)

  await env.DB
    .prepare('UPDATE songs SET content = ?, plain_text = ? WHERE id = ?')
    .bind(JSON.stringify(newContent), newPlainText, id)
    .run()

  const song: Song = {
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.original_key,
    bpm: row.bpm,
    youtubeUrl: row.youtube_url,
    content: newContent,
    plainText: newPlainText,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }

  return json(song)
}

// GET /api/search?q= - Full-text search
export async function searchSongs(request: Request, env: Env, query: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  if (!query.trim()) {
    return json({ songs: [], query: '' })
  }

  const result = await env.DB
    .prepare(`
      SELECT s.id, s.title, s.artist, s.original_key, s.bpm, s.created_at, s.created_by
      FROM songs s
      JOIN songs_fts fts ON s.rowid = fts.rowid
      WHERE songs_fts MATCH ? AND s.workspace_id = ?
      ORDER BY rank
      LIMIT 50
    `)
    .bind(query + '*', ctx.workspaceId)
    .all<SongListRow>()

  return json({ songs: result.results.map(toSongListItem), query })
}
