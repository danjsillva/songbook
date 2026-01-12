import { nanoid } from 'nanoid'
import { parseHtmlToSongLines, generatePlainText, detectKey } from './parser'
import { extractSongFromUrl, classifySongSections } from './groq'
import { verifyFirebaseToken, getTokenFromRequest } from './auth'
import type {
  Song, SongListItem, CreateSongInput, ExtractFromUrlInput,
  Setlist, SetlistListItem, SetlistSong, CreateSetlistInput,
  UpdateSetlistInput, AddSongToSetlistInput, UpdateSetlistSongInput, ReorderSetlistInput
} from '@songbook/shared'

export interface Env {
  DB: D1Database
  GROQ_API_KEY: string
  FIREBASE_PROJECT_ID: string
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Auth helper - returns user ID or null if not authenticated
async function requireAuth(request: Request, env: Env): Promise<string | Response> {
  if (!env.FIREBASE_PROJECT_ID) {
    // Auth not configured, allow all requests (dev mode)
    return 'anonymous'
  }

  const token = getTokenFromRequest(request)
  if (!token) {
    return error('Authentication required', 401)
  }

  const payload = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID)
  if (!payload) {
    return error('Invalid token', 401)
  }

  return payload.sub
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status)
}

// GET /api/songs/recent - 5 músicas mais recentes (por last_viewed_at)
async function getRecentSongs(db: D1Database): Promise<Response> {
  const result = await db
    .prepare('SELECT id, title, artist, original_key, bpm, created_at, created_by FROM songs WHERE last_viewed_at IS NOT NULL ORDER BY last_viewed_at DESC LIMIT 5')
    .all<{ id: string; title: string; artist: string; original_key: string | null; bpm: number | null; created_at: number; created_by: string | null }>()

  const songs: SongListItem[] = result.results.map(row => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.original_key,
    bpm: row.bpm,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }))

  return json(songs)
}

// PUT /api/songs/:id/view - Marca música como visualizada
async function markSongViewed(db: D1Database, id: string): Promise<Response> {
  const result = await db
    .prepare('UPDATE songs SET last_viewed_at = ? WHERE id = ?')
    .bind(Date.now(), id)
    .run()

  if (result.meta.changes === 0) {
    return error('Song not found', 404)
  }

  return json({ success: true })
}

// GET /api/songs - Lista todas as músicas
async function listSongs(db: D1Database): Promise<Response> {
  const result = await db
    .prepare('SELECT id, title, artist, original_key, bpm, created_at, created_by FROM songs ORDER BY created_at DESC')
    .all<{ id: string; title: string; artist: string; original_key: string | null; bpm: number | null; created_at: number; created_by: string | null }>()

  const songs: SongListItem[] = result.results.map(row => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.original_key,
    bpm: row.bpm,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }))

  return json(songs)
}

// GET /api/songs/:id - Busca uma música
async function getSong(db: D1Database, id: string): Promise<Response> {
  const row = await db
    .prepare('SELECT * FROM songs WHERE id = ?')
    .bind(id)
    .first<{ id: string; title: string; artist: string; original_key: string | null; bpm: number | null; youtube_url: string | null; content: string; plain_text: string; created_at: number; created_by: string | null }>()

  if (!row) {
    return error('Song not found', 404)
  }

  const song: Song = {
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

  return json(song)
}

// POST /api/songs - Cria uma música
async function createSong(db: D1Database, input: CreateSongInput, userId: string): Promise<Response> {
  const id = nanoid(10)
  const content = parseHtmlToSongLines(input.html)
  const plainText = generatePlainText(content)
  const originalKey = input.originalKey || detectKey(content)
  const bpm = input.bpm || null
  const youtubeUrl = input.youtubeUrl || null
  const createdAt = Date.now()
  const createdBy = userId === 'anonymous' ? null : userId

  await db
    .prepare(
      'INSERT INTO songs (id, title, artist, original_key, bpm, youtube_url, content, plain_text, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, input.title, input.artist, originalKey, bpm, youtubeUrl, JSON.stringify(content), plainText, createdAt, createdBy)
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

// PUT /api/songs/:id - Atualiza uma música
async function updateSong(db: D1Database, id: string, input: CreateSongInput): Promise<Response> {
  const content = parseHtmlToSongLines(input.html)
  const plainText = generatePlainText(content)
  const originalKey = input.originalKey || detectKey(content)
  const bpm = input.bpm || null
  const youtubeUrl = input.youtubeUrl || null

  const result = await db
    .prepare(
      'UPDATE songs SET title = ?, artist = ?, original_key = ?, bpm = ?, youtube_url = ?, content = ?, plain_text = ? WHERE id = ?'
    )
    .bind(input.title, input.artist, originalKey, bpm, youtubeUrl, JSON.stringify(content), plainText, id)
    .run()

  if (result.meta.changes === 0) {
    return error('Song not found', 404)
  }

  // Busca a música atualizada
  return getSong(db, id)
}

// DELETE /api/songs/:id - Remove uma música
async function deleteSong(db: D1Database, id: string): Promise<Response> {
  const result = await db.prepare('DELETE FROM songs WHERE id = ?').bind(id).run()

  if (result.meta.changes === 0) {
    return error('Song not found', 404)
  }

  return json({ success: true })
}

// POST /api/songs/:id/classify - Classifica seções da música usando IA
async function classifySong(db: D1Database, id: string, apiKey: string): Promise<Response> {
  // Buscar música
  const row = await db
    .prepare('SELECT * FROM songs WHERE id = ?')
    .bind(id)
    .first<{ id: string; title: string; artist: string; original_key: string | null; bpm: number | null; youtube_url: string | null; content: string; plain_text: string; created_at: number; created_by: string | null }>()

  if (!row) {
    return error('Song not found', 404)
  }

  // Gerar texto com acordes para classificação
  const existingContent = JSON.parse(row.content) as Array<{ lyrics: string; chords: Array<{ chord: string; position: number }> }>

  // Reconstruir o formato de cifra (acordes acima da letra)
  let lyricsWithChords = ''
  for (const line of existingContent) {
    if (line.chords.length > 0) {
      // Linha de acordes
      let chordLine = ''
      let lastPos = 0
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

  // Chamar Groq para classificar
  const classifiedLyrics = await classifySongSections(lyricsWithChords, apiKey)

  // Re-parsear o resultado
  const newContent = parseHtmlToSongLines(classifiedLyrics)
  const newPlainText = generatePlainText(newContent)

  // Atualizar no banco
  await db
    .prepare('UPDATE songs SET content = ?, plain_text = ? WHERE id = ?')
    .bind(JSON.stringify(newContent), newPlainText, id)
    .run()

  // Retornar música atualizada
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

// GET /api/search?q= - Busca full-text
async function searchSongs(db: D1Database, query: string): Promise<Response> {
  if (!query.trim()) {
    return json({ songs: [], query: '' })
  }

  // Busca usando FTS5
  const result = await db
    .prepare(`
      SELECT s.id, s.title, s.artist, s.original_key, s.bpm, s.created_at, s.created_by
      FROM songs s
      JOIN songs_fts fts ON s.rowid = fts.rowid
      WHERE songs_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `)
    .bind(query + '*')
    .all<{ id: string; title: string; artist: string; original_key: string | null; bpm: number | null; created_at: number; created_by: string | null }>()

  const songs: SongListItem[] = result.results.map(row => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    originalKey: row.original_key,
    bpm: row.bpm,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }))

  return json({ songs, query })
}

// ============ SETLISTS ============

// GET /api/setlists/recent - 5 setlists mais recentes (por last_viewed_at)
async function getRecentSetlists(db: D1Database): Promise<Response> {
  const result = await db
    .prepare(`
      SELECT s.id, s.name, s.date, s.created_at, s.created_by,
        (SELECT COUNT(*) FROM setlist_songs WHERE setlist_id = s.id) as song_count
      FROM setlists s
      WHERE s.last_viewed_at IS NOT NULL
      ORDER BY s.last_viewed_at DESC
      LIMIT 5
    `)
    .all<{ id: string; name: string; date: string; created_at: number; created_by: string | null; song_count: number }>()

  const setlists: SetlistListItem[] = result.results.map(row => ({
    id: row.id,
    name: row.name,
    date: row.date,
    songCount: row.song_count,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }))

  return json(setlists)
}

// PUT /api/setlists/:id/view - Marca setlist como visualizado
async function markSetlistViewed(db: D1Database, id: string): Promise<Response> {
  const result = await db
    .prepare('UPDATE setlists SET last_viewed_at = ? WHERE id = ?')
    .bind(Date.now(), id)
    .run()

  if (result.meta.changes === 0) {
    return error('Setlist not found', 404)
  }

  return json({ success: true })
}

// GET /api/setlists - Lista todos os setlists
async function listSetlists(db: D1Database): Promise<Response> {
  const result = await db
    .prepare(`
      SELECT s.id, s.name, s.date, s.created_at, s.created_by,
        (SELECT COUNT(*) FROM setlist_songs WHERE setlist_id = s.id) as song_count
      FROM setlists s
      ORDER BY s.date DESC
    `)
    .all<{ id: string; name: string; date: string; created_at: number; created_by: string | null; song_count: number }>()

  const setlists: SetlistListItem[] = result.results.map(row => ({
    id: row.id,
    name: row.name,
    date: row.date,
    songCount: row.song_count,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }))

  return json(setlists)
}

// GET /api/setlists/:id - Busca setlist com músicas
async function getSetlist(db: D1Database, id: string): Promise<Response> {
  const setlistRow = await db
    .prepare('SELECT * FROM setlists WHERE id = ?')
    .bind(id)
    .first<{ id: string; name: string; date: string; created_at: number; created_by: string | null }>()

  if (!setlistRow) {
    return error('Setlist not found', 404)
  }

  const songsResult = await db
    .prepare(`
      SELECT ss.id, ss.song_id, ss.position, ss.key, ss.bpm as setlist_bpm, ss.notes,
        s.title, s.artist, s.original_key, s.bpm, s.created_at, s.created_by
      FROM setlist_songs ss
      JOIN songs s ON ss.song_id = s.id
      WHERE ss.setlist_id = ?
      ORDER BY ss.position
    `)
    .bind(id)
    .all<{
      id: string; song_id: string; position: number; key: string; setlist_bpm: number | null; notes: string | null;
      title: string; artist: string; original_key: string | null; bpm: number | null; created_at: number; created_by: string | null
    }>()

  const songs: SetlistSong[] = songsResult.results.map(row => ({
    id: row.id,
    songId: row.song_id,
    position: row.position,
    key: row.key,
    bpm: row.setlist_bpm,
    notes: row.notes,
    song: {
      id: row.song_id,
      title: row.title,
      artist: row.artist,
      originalKey: row.original_key,
      bpm: row.bpm,
      createdAt: row.created_at,
      createdBy: row.created_by,
    },
  }))

  const setlist: Setlist = {
    id: setlistRow.id,
    name: setlistRow.name,
    date: setlistRow.date,
    songs,
    createdAt: setlistRow.created_at,
    createdBy: setlistRow.created_by,
  }

  return json(setlist)
}

// POST /api/setlists - Cria setlist
async function createSetlist(db: D1Database, input: CreateSetlistInput, userId: string): Promise<Response> {
  const id = nanoid(10)
  const createdAt = Date.now()
  const createdBy = userId === 'anonymous' ? null : userId

  await db
    .prepare('INSERT INTO setlists (id, name, date, created_at, created_by) VALUES (?, ?, ?, ?, ?)')
    .bind(id, input.name, input.date, createdAt, createdBy)
    .run()

  const setlist: Setlist = {
    id,
    name: input.name,
    date: input.date,
    songs: [],
    createdAt,
    createdBy,
  }

  return json(setlist, 201)
}

// PUT /api/setlists/:id - Atualiza setlist
async function updateSetlist(db: D1Database, id: string, input: UpdateSetlistInput): Promise<Response> {
  const updates: string[] = []
  const values: (string | number)[] = []

  if (input.name) {
    updates.push('name = ?')
    values.push(input.name)
  }
  if (input.date) {
    updates.push('date = ?')
    values.push(input.date)
  }

  if (updates.length === 0) {
    return error('No fields to update')
  }

  values.push(id)
  const result = await db
    .prepare(`UPDATE setlists SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  if (result.meta.changes === 0) {
    return error('Setlist not found', 404)
  }

  return getSetlist(db, id)
}

// DELETE /api/setlists/:id - Remove setlist
async function deleteSetlist(db: D1Database, id: string): Promise<Response> {
  const result = await db.prepare('DELETE FROM setlists WHERE id = ?').bind(id).run()

  if (result.meta.changes === 0) {
    return error('Setlist not found', 404)
  }

  return json({ success: true })
}

// POST /api/setlists/:id/songs - Adiciona música ao setlist
async function addSongToSetlist(db: D1Database, setlistId: string, input: AddSongToSetlistInput): Promise<Response> {
  // Verificar se setlist existe
  const setlist = await db.prepare('SELECT id FROM setlists WHERE id = ?').bind(setlistId).first()
  if (!setlist) {
    return error('Setlist not found', 404)
  }

  // Verificar se música existe
  const song = await db.prepare('SELECT id FROM songs WHERE id = ?').bind(input.songId).first()
  if (!song) {
    return error('Song not found', 404)
  }

  // Pegar próxima posição
  const lastPos = await db
    .prepare('SELECT MAX(position) as max_pos FROM setlist_songs WHERE setlist_id = ?')
    .bind(setlistId)
    .first<{ max_pos: number | null }>()

  const position = (lastPos?.max_pos ?? -1) + 1
  const id = nanoid(10)

  try {
    await db
      .prepare('INSERT INTO setlist_songs (id, setlist_id, song_id, position, key, bpm, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, setlistId, input.songId, position, input.key, input.bpm || null, input.notes || null)
      .run()
  } catch {
    return error('Song already in setlist', 400)
  }

  return getSetlist(db, setlistId)
}

// DELETE /api/setlists/:id/items/:itemId - Remove item do setlist
async function removeItemFromSetlist(db: D1Database, setlistId: string, itemId: string): Promise<Response> {
  const result = await db
    .prepare('DELETE FROM setlist_songs WHERE id = ? AND setlist_id = ?')
    .bind(itemId, setlistId)
    .run()

  if (result.meta.changes === 0) {
    return error('Item not in setlist', 404)
  }

  // Reordenar posições
  await db
    .prepare(`
      UPDATE setlist_songs
      SET position = (
        SELECT COUNT(*) FROM setlist_songs ss2
        WHERE ss2.setlist_id = setlist_songs.setlist_id
        AND ss2.position < setlist_songs.position
      )
      WHERE setlist_id = ?
    `)
    .bind(setlistId)
    .run()

  return getSetlist(db, setlistId)
}

// PUT /api/setlists/:id/items/:itemId - Atualiza item do setlist
async function updateSetlistItem(db: D1Database, setlistId: string, itemId: string, input: UpdateSetlistSongInput): Promise<Response> {
  const updates: string[] = []
  const values: (string | number | null)[] = []

  if (input.key !== undefined) {
    updates.push('key = ?')
    values.push(input.key)
  }
  if (input.bpm !== undefined) {
    updates.push('bpm = ?')
    values.push(input.bpm)
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?')
    values.push(input.notes)
  }

  if (updates.length === 0) {
    return error('No fields to update')
  }

  values.push(itemId, setlistId)
  const result = await db
    .prepare(`UPDATE setlist_songs SET ${updates.join(', ')} WHERE id = ? AND setlist_id = ?`)
    .bind(...values)
    .run()

  if (result.meta.changes === 0) {
    return error('Item not found', 404)
  }

  return getSetlist(db, setlistId)
}

// PUT /api/setlists/:id/reorder - Reordena músicas
async function reorderSetlist(db: D1Database, setlistId: string, input: ReorderSetlistInput): Promise<Response> {
  // Atualizar posições usando o ID do item (não song_id)
  for (let i = 0; i < input.itemIds.length; i++) {
    await db
      .prepare('UPDATE setlist_songs SET position = ? WHERE setlist_id = ? AND id = ?')
      .bind(i, setlistId, input.itemIds[i])
      .run()
  }

  return getSetlist(db, setlistId)
}

// Router principal
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    try {
      // GET /api/songs/recent
      if (path === '/api/songs/recent' && method === 'GET') {
        return getRecentSongs(env.DB)
      }

      // GET /api/songs
      if (path === '/api/songs' && method === 'GET') {
        return listSongs(env.DB)
      }

      // POST /api/songs (protected)
      if (path === '/api/songs' && method === 'POST') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        const input = await request.json<CreateSongInput>()
        if (!input.title || !input.artist || !input.html) {
          return error('Missing required fields: title, artist, html')
        }
        return createSong(env.DB, input, auth)
      }

      // PUT /api/songs/:id/view
      const songViewMatch = path.match(/^\/api\/songs\/([^/]+)\/view$/)
      if (songViewMatch && method === 'PUT') {
        return markSongViewed(env.DB, songViewMatch[1])
      }

      // POST /api/songs/:id/classify (protected)
      const songClassifyMatch = path.match(/^\/api\/songs\/([^/]+)\/classify$/)
      if (songClassifyMatch && method === 'POST') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        if (!env.GROQ_API_KEY) {
          return error('GROQ_API_KEY not configured', 500)
        }
        try {
          return await classifySong(env.DB, songClassifyMatch[1], env.GROQ_API_KEY)
        } catch (err) {
          console.error('Classification error:', err)
          return error(
            err instanceof Error ? err.message : 'Falha ao classificar seções',
            500
          )
        }
      }

      // GET /api/songs/:id
      const songMatch = path.match(/^\/api\/songs\/([^/]+)$/)
      if (songMatch && method === 'GET') {
        return getSong(env.DB, songMatch[1])
      }

      // PUT /api/songs/:id (protected)
      if (songMatch && method === 'PUT') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        const input = await request.json<CreateSongInput>()
        if (!input.title || !input.artist || !input.html) {
          return error('Missing required fields: title, artist, html')
        }
        return updateSong(env.DB, songMatch[1], input)
      }

      // DELETE /api/songs/:id (protected)
      if (songMatch && method === 'DELETE') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        return deleteSong(env.DB, songMatch[1])
      }

      // GET /api/search?q=
      if (path === '/api/search' && method === 'GET') {
        const query = url.searchParams.get('q') || ''
        return searchSongs(env.DB, query)
      }

      // POST /api/extract - Extrai dados de uma URL via Groq LLM (protected)
      if (path === '/api/extract' && method === 'POST') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        const input = await request.json<ExtractFromUrlInput>()

        if (!input.url) {
          return error('Missing required field: url')
        }

        if (!env.GROQ_API_KEY) {
          return error('GROQ_API_KEY not configured', 500)
        }

        try {
          const extracted = await extractSongFromUrl(input.url, env.GROQ_API_KEY)
          return json(extracted)
        } catch (err) {
          console.error('Extraction error:', err)
          return error(
            err instanceof Error ? err.message : 'Falha ao extrair dados da música',
            500
          )
        }
      }

      // ============ SETLISTS ============

      // GET /api/setlists/recent
      if (path === '/api/setlists/recent' && method === 'GET') {
        return getRecentSetlists(env.DB)
      }

      // GET /api/setlists
      if (path === '/api/setlists' && method === 'GET') {
        return listSetlists(env.DB)
      }

      // POST /api/setlists (protected)
      if (path === '/api/setlists' && method === 'POST') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        const input = await request.json<CreateSetlistInput>()
        if (!input.name || !input.date) {
          return error('Missing required fields: name, date')
        }
        return createSetlist(env.DB, input, auth)
      }

      // PUT /api/setlists/:id/view
      const setlistViewMatch = path.match(/^\/api\/setlists\/([^/]+)\/view$/)
      if (setlistViewMatch && method === 'PUT') {
        return markSetlistViewed(env.DB, setlistViewMatch[1])
      }

      // Rotas com :id
      const setlistMatch = path.match(/^\/api\/setlists\/([^/]+)$/)
      if (setlistMatch) {
        const id = setlistMatch[1]
        if (method === 'GET') return getSetlist(env.DB, id)
        if (method === 'PUT') {
          const auth = await requireAuth(request, env)
          if (auth instanceof Response) return auth

          const input = await request.json<UpdateSetlistInput>()
          return updateSetlist(env.DB, id, input)
        }
        if (method === 'DELETE') {
          const auth = await requireAuth(request, env)
          if (auth instanceof Response) return auth

          return deleteSetlist(env.DB, id)
        }
      }

      // POST /api/setlists/:id/songs (protected)
      const addSongMatch = path.match(/^\/api\/setlists\/([^/]+)\/songs$/)
      if (addSongMatch && method === 'POST') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        const input = await request.json<AddSongToSetlistInput>()
        if (!input.songId || !input.key) {
          return error('Missing required fields: songId, key')
        }
        return addSongToSetlist(env.DB, addSongMatch[1], input)
      }

      // PUT/DELETE /api/setlists/:id/items/:itemId (protected)
      const itemMatch = path.match(/^\/api\/setlists\/([^/]+)\/items\/([^/]+)$/)
      if (itemMatch && method === 'DELETE') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        return removeItemFromSetlist(env.DB, itemMatch[1], itemMatch[2])
      }
      if (itemMatch && method === 'PUT') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        const input = await request.json<UpdateSetlistSongInput>()
        return updateSetlistItem(env.DB, itemMatch[1], itemMatch[2], input)
      }

      // PUT /api/setlists/:id/reorder (protected)
      const reorderMatch = path.match(/^\/api\/setlists\/([^/]+)\/reorder$/)
      if (reorderMatch && method === 'PUT') {
        const auth = await requireAuth(request, env)
        if (auth instanceof Response) return auth

        const input = await request.json<ReorderSetlistInput>()
        if (!input.itemIds) {
          return error('Missing required field: itemIds')
        }
        return reorderSetlist(env.DB, reorderMatch[1], input)
      }

      return error('Not found', 404)
    } catch (err) {
      console.error(err)
      return error('Internal server error', 500)
    }
  },
}
