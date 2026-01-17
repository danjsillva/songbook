import type {
  Song, SongListItem, CreateSongInput, SearchResult, ExtractedSongData, ExtractFromUrlInput,
  Setlist, SetlistListItem, CreateSetlistInput, UpdateSetlistInput, AddSongToSetlistInput, UpdateSetlistSongInput, ReorderSetlistInput,
  User, SyncUserInput,
  Workspace, CreateWorkspaceInput, UpdateWorkspaceInput, CreateInviteInput, InviteInfo
} from '@songbook/shared'
import { getAuthToken } from '../contexts/AuthContext'
import { getWorkspaceId } from '../contexts/WorkspaceContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options?: RequestInit & { skipWorkspace?: boolean }): Promise<T> {
  const token = getAuthToken()
  const workspaceId = getWorkspaceId()
  const { skipWorkspace, ...fetchOptions } = options || {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Include workspace ID for most requests (except auth/workspace management)
  if (workspaceId && !skipWorkspace) {
    headers['X-Workspace-Id'] = workspaceId
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...fetchOptions?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  // ============ WORKSPACES ============
  workspaces: {
    create: (input: CreateWorkspaceInput) =>
      request<Workspace>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(input),
        skipWorkspace: true,
      }),

    getBySlug: (slug: string) =>
      request<Workspace>(`/workspaces/${slug}`, { skipWorkspace: true }),

    update: (id: string, input: UpdateWorkspaceInput) =>
      request<Workspace>(`/workspaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),

    getMyWorkspace: () =>
      request<Workspace | null>('/me/workspace', { skipWorkspace: true }),

    createInvite: (workspaceId: string, input: CreateInviteInput) =>
      request<{ token: string; expiresAt: number }>(`/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },

  // ============ INVITES ============
  invites: {
    getInfo: (token: string) =>
      request<InviteInfo>(`/invites/${token}`, { skipWorkspace: true }),

    accept: (token: string) =>
      request<Workspace>(`/invites/${token}/accept`, {
        method: 'POST',
        skipWorkspace: true,
      }),
  },

  // ============ SONGS ============
  songs: {
    list: () => request<SongListItem[]>('/songs'),

    recent: () => request<SongListItem[]>('/songs/recent'),

    get: (id: string) => request<Song>(`/songs/${id}`),

    markViewed: (id: string) =>
      request<{ success: boolean }>(`/songs/${id}/view`, { method: 'PUT' }),

    create: (input: CreateSongInput) =>
      request<Song>('/songs', {
        method: 'POST',
        body: JSON.stringify(input),
      }),

    update: (id: string, input: CreateSongInput) =>
      request<Song>(`/songs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/songs/${id}`, {
        method: 'DELETE',
      }),

    classify: (id: string) =>
      request<Song>(`/songs/${id}/classify`, {
        method: 'POST',
      }),
  },

  search: (query: string) =>
    request<SearchResult>(`/search?q=${encodeURIComponent(query)}`),

  extract: (input: ExtractFromUrlInput) =>
    request<ExtractedSongData>('/extract', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // ============ SETLISTS ============
  setlists: {
    list: () => request<SetlistListItem[]>('/setlists'),

    recent: () => request<SetlistListItem[]>('/setlists/recent'),

    get: (id: string) => request<Setlist>(`/setlists/${id}`),

    markViewed: (id: string) =>
      request<{ success: boolean }>(`/setlists/${id}/view`, { method: 'PUT' }),

    create: (input: CreateSetlistInput) =>
      request<Setlist>('/setlists', {
        method: 'POST',
        body: JSON.stringify(input),
      }),

    update: (id: string, input: UpdateSetlistInput) =>
      request<Setlist>(`/setlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/setlists/${id}`, {
        method: 'DELETE',
      }),

    addSong: (setlistId: string, input: AddSongToSetlistInput) =>
      request<Setlist>(`/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),

    removeItem: (setlistId: string, itemId: string) =>
      request<Setlist>(`/setlists/${setlistId}/items/${itemId}`, {
        method: 'DELETE',
      }),

    updateItem: (setlistId: string, itemId: string, input: UpdateSetlistSongInput) =>
      request<Setlist>(`/setlists/${setlistId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),

    reorder: (setlistId: string, input: ReorderSetlistInput) =>
      request<Setlist>(`/setlists/${setlistId}/reorder`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  },

  // ============ USERS ============
  users: {
    sync: (input: SyncUserInput) =>
      request<User>('/users/sync', {
        method: 'POST',
        body: JSON.stringify(input),
        skipWorkspace: true,
      }),

    me: () => request<User>('/me', { skipWorkspace: true }),

    get: (id: string) => request<User>(`/users/${id}`, { skipWorkspace: true }),

    getMany: (ids: string[]) =>
      request<User[]>(`/users?ids=${ids.join(',')}`, { skipWorkspace: true }),
  },
}
