import { json, error } from '../lib/response'
import { requireAuth } from '../middleware/auth'
import type { Env, UserRow } from '../lib/types'
import type { User, SyncUserInput } from '@songbook/shared'

// Helper to map row to User
function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    photoUrl: row.photo_url,
    workspaceId: row.workspace_id,
    role: row.role || 'member',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// POST /api/users/sync - Sync user profile from Firebase Auth
export async function syncUser(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) return authResult
  const userId = authResult

  const input = await request.json<SyncUserInput>()
  const now = Date.now()

  // Check if user exists
  const existing = await env.DB
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(userId)
    .first()

  if (existing) {
    // Update existing user (preserve workspace_id and role)
    await env.DB
      .prepare('UPDATE users SET name = ?, email = ?, photo_url = ?, updated_at = ? WHERE id = ?')
      .bind(input.name || null, input.email || null, input.photoUrl || null, now, userId)
      .run()
  } else {
    // Insert new user (no workspace yet)
    await env.DB
      .prepare('INSERT INTO users (id, name, email, photo_url, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(userId, input.name || null, input.email || null, input.photoUrl || null, 'member', now, now)
      .run()
  }

  return getUser(env, userId)
}

// GET /api/users/:id - Get user by ID
export async function getUser(env: Env, userId: string): Promise<Response> {
  const row = await env.DB
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<UserRow>()

  if (!row) {
    return error('User not found', 404)
  }

  return json(toUser(row))
}

// GET /api/users?ids=id1,id2,id3 - Get multiple users
export async function getUsers(env: Env, ids: string[]): Promise<Response> {
  if (ids.length === 0) {
    return json([])
  }

  const placeholders = ids.map(() => '?').join(',')
  const result = await env.DB
    .prepare(`SELECT * FROM users WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<UserRow>()

  return json(result.results.map(toUser))
}

// GET /api/me - Get current user
export async function getMe(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) return authResult
  const userId = authResult

  return getUser(env, userId)
}
