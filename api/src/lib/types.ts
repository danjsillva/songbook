import type { UserRole } from '@songbook/shared'

export interface Env {
  DB: D1Database
  GROQ_API_KEY: string
  FIREBASE_PROJECT_ID: string
}

// Database row types
export interface SongRow {
  id: string
  workspace_id: string | null
  title: string
  artist: string
  original_key: string | null
  bpm: number | null
  youtube_url: string | null
  content: string
  plain_text: string
  created_at: number
  last_viewed_at: number | null
  created_by: string | null
}

export interface SongListRow {
  id: string
  title: string
  artist: string
  original_key: string | null
  bpm: number | null
  created_at: number
  created_by: string | null
}

export interface SetlistRow {
  id: string
  workspace_id: string | null
  name: string
  date: string
  created_at: number
  last_viewed_at: number | null
  created_by: string | null
}

export interface SetlistListRow extends SetlistRow {
  song_count: number
}

export interface SetlistSongRow {
  id: string
  song_id: string
  position: number
  key: string
  setlist_bpm: number | null
  notes: string | null
  title: string
  artist: string
  original_key: string | null
  bpm: number | null
  created_at: number
  created_by: string | null
}

export interface UserRow {
  id: string
  workspace_id: string | null
  role: UserRole
  name: string | null
  email: string | null
  photo_url: string | null
  created_at: number
  updated_at: number
}

export interface WorkspaceRow {
  id: string
  name: string
  slug: string
  created_at: number
}

export interface InviteRow {
  id: string
  workspace_id: string
  email: string
  role: UserRole
  token: string
  expires_at: number
  created_by: string
  created_at: number
  used_at: number | null
}

// Context passed to route handlers
export interface WorkspaceContext {
  userId: string
  workspaceId: string
  role: UserRole
}
