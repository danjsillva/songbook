import { nanoid } from 'nanoid'
import { json, error } from '../lib/response'
import { requireWorkspace } from '../middleware/auth'
import type { Env, SetlistRow, SetlistListRow, SetlistSongRow } from '../lib/types'
import type {
  Setlist, SetlistListItem, SetlistSong,
  CreateSetlistInput, UpdateSetlistInput,
  AddSongToSetlistInput, UpdateSetlistSongInput, ReorderSetlistInput
} from '@songbook/shared'

// Helper to map row to SetlistListItem
function toSetlistListItem(row: SetlistListRow): SetlistListItem {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    songCount: row.song_count,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

// GET /api/setlists/recent - 5 most recently viewed setlists
export async function getRecentSetlists(request: Request, env: Env): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare(`
      SELECT s.id, s.name, s.date, s.created_at, s.created_by,
        (SELECT COUNT(*) FROM setlist_songs WHERE setlist_id = s.id) as song_count
      FROM setlists s
      WHERE s.workspace_id = ? AND s.last_viewed_at IS NOT NULL
      ORDER BY s.last_viewed_at DESC
      LIMIT 5
    `)
    .bind(ctx.workspaceId)
    .all<SetlistListRow>()

  return json(result.results.map(toSetlistListItem))
}

// PUT /api/setlists/:id/view - Mark setlist as viewed
export async function markSetlistViewed(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare('UPDATE setlists SET last_viewed_at = ? WHERE id = ? AND workspace_id = ?')
    .bind(Date.now(), id, ctx.workspaceId)
    .run()

  if (result.meta.changes === 0) {
    return error('Setlist not found', 404)
  }

  return json({ success: true })
}

// GET /api/setlists - List all setlists
export async function listSetlists(request: Request, env: Env): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare(`
      SELECT s.id, s.name, s.date, s.created_at, s.created_by,
        (SELECT COUNT(*) FROM setlist_songs WHERE setlist_id = s.id) as song_count
      FROM setlists s
      WHERE s.workspace_id = ?
      ORDER BY s.date DESC
    `)
    .bind(ctx.workspaceId)
    .all<SetlistListRow>()

  return json(result.results.map(toSetlistListItem))
}

// GET /api/setlists/:id - Get setlist with songs
export async function getSetlist(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const setlistRow = await env.DB
    .prepare('SELECT * FROM setlists WHERE id = ? AND workspace_id = ?')
    .bind(id, ctx.workspaceId)
    .first<SetlistRow>()

  if (!setlistRow) {
    return error('Setlist not found', 404)
  }

  const songsResult = await env.DB
    .prepare(`
      SELECT ss.id, ss.song_id, ss.position, ss.key, ss.bpm as setlist_bpm, ss.notes,
        s.title, s.artist, s.original_key, s.bpm, s.created_at, s.created_by
      FROM setlist_songs ss
      JOIN songs s ON ss.song_id = s.id
      WHERE ss.setlist_id = ?
      ORDER BY ss.position
    `)
    .bind(id)
    .all<SetlistSongRow>()

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

// POST /api/setlists - Create setlist
export async function createSetlist(request: Request, env: Env): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const input = await request.json<CreateSetlistInput>()
  if (!input.name || !input.date) {
    return error('Missing required fields: name, date')
  }

  const id = nanoid(10)
  const createdAt = Date.now()
  const createdBy = ctx.userId === 'anonymous' ? null : ctx.userId

  await env.DB
    .prepare('INSERT INTO setlists (id, workspace_id, name, date, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, ctx.workspaceId, input.name, input.date, createdAt, createdBy)
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

// PUT /api/setlists/:id - Update setlist
export async function updateSetlist(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const input = await request.json<UpdateSetlistInput>()

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

  values.push(id, ctx.workspaceId)
  const result = await env.DB
    .prepare(`UPDATE setlists SET ${updates.join(', ')} WHERE id = ? AND workspace_id = ?`)
    .bind(...values)
    .run()

  if (result.meta.changes === 0) {
    return error('Setlist not found', 404)
  }

  return getSetlist(request, env, id)
}

// DELETE /api/setlists/:id - Delete setlist
export async function deleteSetlist(request: Request, env: Env, id: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const result = await env.DB
    .prepare('DELETE FROM setlists WHERE id = ? AND workspace_id = ?')
    .bind(id, ctx.workspaceId)
    .run()

  if (result.meta.changes === 0) {
    return error('Setlist not found', 404)
  }

  return json({ success: true })
}

// POST /api/setlists/:id/songs - Add song to setlist
export async function addSongToSetlist(request: Request, env: Env, setlistId: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const input = await request.json<AddSongToSetlistInput>()
  if (!input.songId || !input.key) {
    return error('Missing required fields: songId, key')
  }

  // Verify setlist exists and belongs to workspace
  const setlist = await env.DB
    .prepare('SELECT id FROM setlists WHERE id = ? AND workspace_id = ?')
    .bind(setlistId, ctx.workspaceId)
    .first()
  if (!setlist) {
    return error('Setlist not found', 404)
  }

  // Verify song exists and belongs to workspace
  const song = await env.DB
    .prepare('SELECT id FROM songs WHERE id = ? AND workspace_id = ?')
    .bind(input.songId, ctx.workspaceId)
    .first()
  if (!song) {
    return error('Song not found', 404)
  }

  // Get next position
  const lastPos = await env.DB
    .prepare('SELECT MAX(position) as max_pos FROM setlist_songs WHERE setlist_id = ?')
    .bind(setlistId)
    .first<{ max_pos: number | null }>()

  const position = (lastPos?.max_pos ?? -1) + 1
  const id = nanoid(10)

  await env.DB
    .prepare('INSERT INTO setlist_songs (id, setlist_id, song_id, position, key, bpm, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, setlistId, input.songId, position, input.key, input.bpm || null, input.notes || null)
    .run()

  return getSetlist(request, env, setlistId)
}

// DELETE /api/setlists/:id/items/:itemId - Remove item from setlist
export async function removeItemFromSetlist(request: Request, env: Env, setlistId: string, itemId: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  // Verify setlist belongs to workspace
  const setlist = await env.DB
    .prepare('SELECT id FROM setlists WHERE id = ? AND workspace_id = ?')
    .bind(setlistId, ctx.workspaceId)
    .first()
  if (!setlist) {
    return error('Setlist not found', 404)
  }

  const result = await env.DB
    .prepare('DELETE FROM setlist_songs WHERE id = ? AND setlist_id = ?')
    .bind(itemId, setlistId)
    .run()

  if (result.meta.changes === 0) {
    return error('Item not in setlist', 404)
  }

  // Reorder positions
  await env.DB
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

  return getSetlist(request, env, setlistId)
}

// PUT /api/setlists/:id/items/:itemId - Update setlist item
export async function updateSetlistItem(request: Request, env: Env, setlistId: string, itemId: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  // Verify setlist belongs to workspace
  const setlist = await env.DB
    .prepare('SELECT id FROM setlists WHERE id = ? AND workspace_id = ?')
    .bind(setlistId, ctx.workspaceId)
    .first()
  if (!setlist) {
    return error('Setlist not found', 404)
  }

  const input = await request.json<UpdateSetlistSongInput>()

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
  const result = await env.DB
    .prepare(`UPDATE setlist_songs SET ${updates.join(', ')} WHERE id = ? AND setlist_id = ?`)
    .bind(...values)
    .run()

  if (result.meta.changes === 0) {
    return error('Item not found', 404)
  }

  return getSetlist(request, env, setlistId)
}

// PUT /api/setlists/:id/reorder - Reorder songs
export async function reorderSetlist(request: Request, env: Env, setlistId: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  // Verify setlist belongs to workspace
  const setlist = await env.DB
    .prepare('SELECT id FROM setlists WHERE id = ? AND workspace_id = ?')
    .bind(setlistId, ctx.workspaceId)
    .first()
  if (!setlist) {
    return error('Setlist not found', 404)
  }

  const input = await request.json<ReorderSetlistInput>()
  if (!input.itemIds) {
    return error('Missing required field: itemIds')
  }

  for (let i = 0; i < input.itemIds.length; i++) {
    await env.DB
      .prepare('UPDATE setlist_songs SET position = ? WHERE setlist_id = ? AND id = ?')
      .bind(i, setlistId, input.itemIds[i])
      .run()
  }

  return getSetlist(request, env, setlistId)
}
