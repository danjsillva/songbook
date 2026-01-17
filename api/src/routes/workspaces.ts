import { nanoid } from 'nanoid'
import { json, error } from '../lib/response'
import { requireAuth, requireWorkspace, requireAdmin } from '../middleware/auth'
import type { Env, WorkspaceRow, InviteRow, UserRow } from '../lib/types'
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput, CreateInviteInput, InviteInfo, User } from '@songbook/shared'

// Helper to validate slug format
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50
}

// POST /api/workspaces - Create workspace (first user becomes admin)
export async function createWorkspace(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) return authResult
  const userId = authResult

  const input = await request.json<CreateWorkspaceInput>()
  if (!input.name || !input.slug) {
    return error('Missing required fields: name, slug')
  }

  if (!isValidSlug(input.slug)) {
    return error('Invalid slug: use lowercase letters, numbers, and hyphens only (3-50 chars)')
  }

  // Check if slug is already taken
  const existing = await env.DB
    .prepare('SELECT id FROM workspaces WHERE slug = ?')
    .bind(input.slug)
    .first()

  if (existing) {
    return error('Slug already taken')
  }

  // Check if user already has a workspace
  const user = await env.DB
    .prepare('SELECT workspace_id FROM users WHERE id = ?')
    .bind(userId)
    .first<Pick<UserRow, 'workspace_id'>>()

  if (user?.workspace_id) {
    return error('User already belongs to a workspace')
  }

  const workspaceId = nanoid(10)
  const createdAt = Date.now()

  // Create workspace
  await env.DB
    .prepare('INSERT INTO workspaces (id, name, slug, created_at) VALUES (?, ?, ?, ?)')
    .bind(workspaceId, input.name, input.slug, createdAt)
    .run()

  // Update user to belong to this workspace as admin
  await env.DB
    .prepare('UPDATE users SET workspace_id = ?, role = ? WHERE id = ?')
    .bind(workspaceId, 'admin', userId)
    .run()

  const workspace: Workspace = {
    id: workspaceId,
    name: input.name,
    slug: input.slug,
    createdAt,
  }

  return json(workspace, 201)
}

// GET /api/workspaces/:slug - Get workspace by slug
export async function getWorkspaceBySlug(env: Env, slug: string): Promise<Response> {
  const row = await env.DB
    .prepare('SELECT * FROM workspaces WHERE slug = ?')
    .bind(slug)
    .first<WorkspaceRow>()

  if (!row) {
    return error('Workspace not found', 404)
  }

  const workspace: Workspace = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  }

  return json(workspace)
}

// PUT /api/workspaces/:id - Update workspace (admin only)
export async function updateWorkspace(request: Request, env: Env, workspaceId: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const adminCheck = requireAdmin(ctx)
  if (adminCheck) return adminCheck

  if (ctx.workspaceId !== workspaceId) {
    return error('Cannot update another workspace', 403)
  }

  const input = await request.json<UpdateWorkspaceInput>()
  if (!input.name) {
    return error('No fields to update')
  }

  await env.DB
    .prepare('UPDATE workspaces SET name = ? WHERE id = ?')
    .bind(input.name, workspaceId)
    .run()

  return getWorkspaceById(env, workspaceId)
}

// Helper to get workspace by ID
async function getWorkspaceById(env: Env, id: string): Promise<Response> {
  const row = await env.DB
    .prepare('SELECT * FROM workspaces WHERE id = ?')
    .bind(id)
    .first<WorkspaceRow>()

  if (!row) {
    return error('Workspace not found', 404)
  }

  const workspace: Workspace = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  }

  return json(workspace)
}

// POST /api/workspaces/:id/invites - Create invite (admin only)
export async function createInvite(request: Request, env: Env, workspaceId: string): Promise<Response> {
  const ctxResult = await requireWorkspace(request, env)
  if (ctxResult instanceof Response) return ctxResult
  const ctx = ctxResult

  const adminCheck = requireAdmin(ctx)
  if (adminCheck) return adminCheck

  if (ctx.workspaceId !== workspaceId) {
    return error('Cannot invite to another workspace', 403)
  }

  const input = await request.json<CreateInviteInput>()
  if (!input.email) {
    return error('Missing required field: email')
  }

  // Check if user with this email already exists in workspace
  const existingUser = await env.DB
    .prepare('SELECT id FROM users WHERE email = ? AND workspace_id = ?')
    .bind(input.email, workspaceId)
    .first()

  if (existingUser) {
    return error('User already in workspace')
  }

  // Check for existing pending invite
  const existingInvite = await env.DB
    .prepare('SELECT id FROM invites WHERE email = ? AND workspace_id = ? AND used_at IS NULL AND expires_at > ?')
    .bind(input.email, workspaceId, Date.now())
    .first()

  if (existingInvite) {
    return error('Pending invite already exists for this email')
  }

  const inviteId = nanoid(10)
  const token = nanoid(32)
  const createdAt = Date.now()
  const expiresAt = createdAt + 7 * 24 * 60 * 60 * 1000 // 7 days
  const role = input.role || 'member'

  await env.DB
    .prepare('INSERT INTO invites (id, workspace_id, email, role, token, expires_at, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(inviteId, workspaceId, input.email, role, token, expiresAt, ctx.userId, createdAt)
    .run()

  return json({ token, expiresAt }, 201)
}

// GET /api/invites/:token - Get invite info (public)
export async function getInviteInfo(env: Env, token: string): Promise<Response> {
  const row = await env.DB
    .prepare(`
      SELECT i.*, w.name as workspace_name, w.slug as workspace_slug, w.created_at as workspace_created_at
      FROM invites i
      JOIN workspaces w ON i.workspace_id = w.id
      WHERE i.token = ?
    `)
    .bind(token)
    .first<InviteRow & { workspace_name: string; workspace_slug: string; workspace_created_at: number }>()

  if (!row) {
    return error('Invite not found', 404)
  }

  if (row.used_at) {
    return error('Invite already used', 400)
  }

  if (row.expires_at < Date.now()) {
    return error('Invite expired', 400)
  }

  // Get inviter info
  const inviter = await env.DB
    .prepare('SELECT id, name, email, photo_url FROM users WHERE id = ?')
    .bind(row.created_by)
    .first<Pick<UserRow, 'id' | 'name' | 'email' | 'photo_url'>>()

  const info: InviteInfo = {
    workspace: {
      id: row.workspace_id,
      name: row.workspace_name,
      slug: row.workspace_slug,
      createdAt: row.workspace_created_at,
    },
    email: row.email,
    invitedBy: inviter ? {
      id: inviter.id,
      name: inviter.name,
      email: inviter.email,
      photoUrl: inviter.photo_url,
      workspaceId: row.workspace_id,
      role: 'admin', // Inviters are always admins
      createdAt: 0,
      updatedAt: 0,
    } : null,
  }

  return json(info)
}

// POST /api/invites/:token/accept - Accept invite
export async function acceptInvite(request: Request, env: Env, token: string): Promise<Response> {
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) return authResult
  const userId = authResult

  const row = await env.DB
    .prepare('SELECT * FROM invites WHERE token = ?')
    .bind(token)
    .first<InviteRow>()

  if (!row) {
    return error('Invite not found', 404)
  }

  if (row.used_at) {
    return error('Invite already used', 400)
  }

  if (row.expires_at < Date.now()) {
    return error('Invite expired', 400)
  }

  // Check if user already has a workspace
  const user = await env.DB
    .prepare('SELECT workspace_id, email FROM users WHERE id = ?')
    .bind(userId)
    .first<Pick<UserRow, 'workspace_id' | 'email'>>()

  if (user?.workspace_id) {
    return error('User already belongs to a workspace')
  }

  // Verify email matches (optional but recommended)
  // if (user?.email && user.email !== row.email) {
  //   return error('Email does not match invite')
  // }

  // Update user to belong to workspace
  await env.DB
    .prepare('UPDATE users SET workspace_id = ?, role = ? WHERE id = ?')
    .bind(row.workspace_id, row.role, userId)
    .run()

  // Mark invite as used
  await env.DB
    .prepare('UPDATE invites SET used_at = ? WHERE id = ?')
    .bind(Date.now(), row.id)
    .run()

  // Return workspace info
  return getWorkspaceById(env, row.workspace_id)
}

// GET /api/me/workspace - Get current user's workspace
export async function getMyWorkspace(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) return authResult
  const userId = authResult

  const user = await env.DB
    .prepare('SELECT workspace_id FROM users WHERE id = ?')
    .bind(userId)
    .first<Pick<UserRow, 'workspace_id'>>()

  if (!user?.workspace_id) {
    return json(null)
  }

  return getWorkspaceById(env, user.workspace_id)
}
