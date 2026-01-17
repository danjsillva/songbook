import { corsHeaders, error } from './lib/response'
import type { Env } from './lib/types'

// Routes
import * as songs from './routes/songs'
import * as setlists from './routes/setlists'
import * as users from './routes/users'
import * as workspaces from './routes/workspaces'
import * as extract from './routes/extract'

export type { Env }

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
      // ============ WORKSPACES ============

      // POST /api/workspaces - Create workspace
      if (path === '/api/workspaces' && method === 'POST') {
        return workspaces.createWorkspace(request, env)
      }

      // GET /api/workspaces/:slug - Get workspace by slug
      const workspaceSlugMatch = path.match(/^\/api\/workspaces\/([^/]+)$/)
      if (workspaceSlugMatch && method === 'GET') {
        return workspaces.getWorkspaceBySlug(env, workspaceSlugMatch[1])
      }

      // PUT /api/workspaces/:id - Update workspace
      if (workspaceSlugMatch && method === 'PUT') {
        return workspaces.updateWorkspace(request, env, workspaceSlugMatch[1])
      }

      // POST /api/workspaces/:id/invites - Create invite
      const workspaceInvitesMatch = path.match(/^\/api\/workspaces\/([^/]+)\/invites$/)
      if (workspaceInvitesMatch && method === 'POST') {
        return workspaces.createInvite(request, env, workspaceInvitesMatch[1])
      }

      // GET /api/invites/:token - Get invite info
      const inviteInfoMatch = path.match(/^\/api\/invites\/([^/]+)$/)
      if (inviteInfoMatch && method === 'GET') {
        return workspaces.getInviteInfo(env, inviteInfoMatch[1])
      }

      // POST /api/invites/:token/accept - Accept invite
      const inviteAcceptMatch = path.match(/^\/api\/invites\/([^/]+)\/accept$/)
      if (inviteAcceptMatch && method === 'POST') {
        return workspaces.acceptInvite(request, env, inviteAcceptMatch[1])
      }

      // GET /api/me/workspace - Get current user's workspace
      if (path === '/api/me/workspace' && method === 'GET') {
        return workspaces.getMyWorkspace(request, env)
      }

      // ============ SONGS ============

      // GET /api/songs/recent
      if (path === '/api/songs/recent' && method === 'GET') {
        return songs.getRecentSongs(request, env)
      }

      // GET /api/songs
      if (path === '/api/songs' && method === 'GET') {
        return songs.listSongs(request, env)
      }

      // POST /api/songs
      if (path === '/api/songs' && method === 'POST') {
        return songs.createSong(request, env)
      }

      // PUT /api/songs/:id/view
      const songViewMatch = path.match(/^\/api\/songs\/([^/]+)\/view$/)
      if (songViewMatch && method === 'PUT') {
        return songs.markSongViewed(request, env, songViewMatch[1])
      }

      // POST /api/songs/:id/classify
      const songClassifyMatch = path.match(/^\/api\/songs\/([^/]+)\/classify$/)
      if (songClassifyMatch && method === 'POST') {
        try {
          return await songs.classifySong(request, env, songClassifyMatch[1])
        } catch (err) {
          console.error('Classification error:', err)
          return error(
            err instanceof Error ? err.message : 'Falha ao classificar seções',
            500
          )
        }
      }

      // GET/PUT/DELETE /api/songs/:id
      const songMatch = path.match(/^\/api\/songs\/([^/]+)$/)
      if (songMatch) {
        const id = songMatch[1]
        if (method === 'GET') return songs.getSong(request, env, id)
        if (method === 'PUT') return songs.updateSong(request, env, id)
        if (method === 'DELETE') return songs.deleteSong(request, env, id)
      }

      // GET /api/search?q=
      if (path === '/api/search' && method === 'GET') {
        const query = url.searchParams.get('q') || ''
        return songs.searchSongs(request, env, query)
      }

      // POST /api/extract
      if (path === '/api/extract' && method === 'POST') {
        return extract.extractFromUrl(request, env)
      }

      // ============ SETLISTS ============

      // GET /api/setlists/recent
      if (path === '/api/setlists/recent' && method === 'GET') {
        return setlists.getRecentSetlists(request, env)
      }

      // GET /api/setlists
      if (path === '/api/setlists' && method === 'GET') {
        return setlists.listSetlists(request, env)
      }

      // POST /api/setlists
      if (path === '/api/setlists' && method === 'POST') {
        return setlists.createSetlist(request, env)
      }

      // PUT /api/setlists/:id/view
      const setlistViewMatch = path.match(/^\/api\/setlists\/([^/]+)\/view$/)
      if (setlistViewMatch && method === 'PUT') {
        return setlists.markSetlistViewed(request, env, setlistViewMatch[1])
      }

      // GET/PUT/DELETE /api/setlists/:id
      const setlistMatch = path.match(/^\/api\/setlists\/([^/]+)$/)
      if (setlistMatch) {
        const id = setlistMatch[1]
        if (method === 'GET') return setlists.getSetlist(request, env, id)
        if (method === 'PUT') return setlists.updateSetlist(request, env, id)
        if (method === 'DELETE') return setlists.deleteSetlist(request, env, id)
      }

      // POST /api/setlists/:id/songs
      const addSongMatch = path.match(/^\/api\/setlists\/([^/]+)\/songs$/)
      if (addSongMatch && method === 'POST') {
        return setlists.addSongToSetlist(request, env, addSongMatch[1])
      }

      // PUT/DELETE /api/setlists/:id/items/:itemId
      const itemMatch = path.match(/^\/api\/setlists\/([^/]+)\/items\/([^/]+)$/)
      if (itemMatch) {
        const [, setlistId, itemId] = itemMatch
        if (method === 'DELETE') return setlists.removeItemFromSetlist(request, env, setlistId, itemId)
        if (method === 'PUT') return setlists.updateSetlistItem(request, env, setlistId, itemId)
      }

      // PUT /api/setlists/:id/reorder
      const reorderMatch = path.match(/^\/api\/setlists\/([^/]+)\/reorder$/)
      if (reorderMatch && method === 'PUT') {
        return setlists.reorderSetlist(request, env, reorderMatch[1])
      }

      // ============ USERS ============

      // POST /api/users/sync
      if (path === '/api/users/sync' && method === 'POST') {
        return users.syncUser(request, env)
      }

      // GET /api/users?ids=id1,id2,id3
      if (path === '/api/users' && method === 'GET') {
        const idsParam = url.searchParams.get('ids')
        if (!idsParam) {
          return error('Missing required query param: ids')
        }
        const ids = idsParam.split(',').filter(id => id.trim())
        return users.getUsers(env, ids)
      }

      // GET /api/users/:id
      const userMatch = path.match(/^\/api\/users\/([^/]+)$/)
      if (userMatch && method === 'GET') {
        return users.getUser(env, userMatch[1])
      }

      // GET /api/me
      if (path === '/api/me' && method === 'GET') {
        return users.getMe(request, env)
      }

      return error('Not found', 404)
    } catch (err) {
      console.error(err)
      return error('Internal server error', 500)
    }
  },
}
