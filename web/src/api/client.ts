import type {
  Song, SongListItem, CreateSongInput, SearchResult, ExtractedSongData, ExtractFromUrlInput,
  Setlist, SetlistListItem, CreateSetlistInput, UpdateSetlistInput, AddSongToSetlistInput, UpdateSetlistSongInput, ReorderSetlistInput
} from '@songbook/shared'

const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
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
}
