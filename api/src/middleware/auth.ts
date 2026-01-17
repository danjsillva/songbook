import { verifyFirebaseToken, getTokenFromRequest } from '../auth'
import { error } from '../lib/response'
import type { Env, WorkspaceContext, UserRow } from '../lib/types'

// Returns user ID or error Response
export async function requireAuth(request: Request, env: Env): Promise<string | Response> {
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

// Returns workspace context or error Response
// Used for routes that require workspace scope
export async function requireWorkspace(request: Request, env: Env): Promise<WorkspaceContext | Response> {
  // First, authenticate the user
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) {
    return authResult
  }
  const userId = authResult

  // Get workspace ID from header
  const workspaceId = request.headers.get('X-Workspace-Id')
  if (!workspaceId) {
    return error('Workspace ID required', 400)
  }

  // Validate user belongs to this workspace
  const user = await env.DB
    .prepare('SELECT workspace_id, role FROM users WHERE id = ?')
    .bind(userId)
    .first<Pick<UserRow, 'workspace_id' | 'role'>>()

  if (!user) {
    return error('User not found', 404)
  }

  if (user.workspace_id !== workspaceId) {
    return error('Access denied to this workspace', 403)
  }

  return {
    userId,
    workspaceId,
    role: user.role,
  }
}

// Check if user is admin in the workspace
export function requireAdmin(ctx: WorkspaceContext): Response | null {
  if (ctx.role !== 'admin') {
    return error('Admin access required', 403)
  }
  return null
}
