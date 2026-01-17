// Posição de um acorde em relação à letra
export interface ChordPosition {
  chord: string    // Ex: "Am7", "G/B", "C#m"
  position: number // Índice do caractere na linha de letra
}

// Gera cor hex consistente baseada no nome do marcador
export function getSectionColor(section: string): string {
  let hash = 0
  for (let i = 0; i < section.length; i++) {
    hash = section.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Gera HSL com saturação e luminosidade fixas para cores vibrantes
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 55%)`
}

// Linha do modelo canônico
export interface SongLine {
  lyrics: string
  chords: ChordPosition[]
  section?: string  // Marcador de seção (qualquer texto)
}

// Música completa
export interface Song {
  id: string
  title: string
  artist: string
  originalKey: string | null
  bpm: number | null
  youtubeUrl: string | null
  content: SongLine[]
  plainText: string
  createdAt: number
  createdBy: string | null
}

// Para criação (sem id e timestamps)
export interface CreateSongInput {
  title: string
  artist: string
  originalKey?: string
  bpm?: number
  youtubeUrl?: string
  html: string // HTML bruto que será parseado
}

// Resposta da lista de músicas (sem content completo)
export interface SongListItem {
  id: string
  title: string
  artist: string
  originalKey: string | null
  bpm: number | null
  createdAt: number
  createdBy: string | null
}

// Resposta da busca
export interface SearchResult {
  songs: SongListItem[]
  query: string
}

// Dados extraídos de uma URL via LLM
export interface ExtractedSongData {
  title: string
  artist: string
  originalKey: string | null
  lyrics: string
}

// Input para extração via URL
export interface ExtractFromUrlInput {
  url: string
}

// ============ SETLISTS ============

// Música no setlist
export interface SetlistSong {
  id: string
  songId: string
  song: SongListItem
  position: number
  key: string
  bpm: number | null
  notes: string | null
}

// Setlist completo
export interface Setlist {
  id: string
  name: string
  date: string
  songs: SetlistSong[]
  createdAt: number
  createdBy: string | null
}

// Para listagem
export interface SetlistListItem {
  id: string
  name: string
  date: string
  songCount: number
  createdAt: number
  createdBy: string | null
}

// Inputs
export interface CreateSetlistInput {
  name: string
  date: string
}

export interface UpdateSetlistInput {
  name?: string
  date?: string
}

export interface AddSongToSetlistInput {
  songId: string
  key: string
  bpm?: number
  notes?: string
}

export interface UpdateSetlistSongInput {
  key?: string
  bpm?: number | null
  notes?: string | null
}

export interface ReorderSetlistInput {
  itemIds: string[]
}

// ============ USERS ============

export type UserRole = 'admin' | 'member'

export interface User {
  id: string
  name: string | null
  email: string | null
  photoUrl: string | null
  workspaceId: string | null
  role: UserRole
  createdAt: number
  updatedAt: number
}

export interface SyncUserInput {
  name?: string | null
  email?: string | null
  photoUrl?: string | null
}

// ============ WORKSPACES ============

export interface Workspace {
  id: string
  name: string
  slug: string
  createdAt: number
}

export interface CreateWorkspaceInput {
  name: string
  slug: string
}

export interface UpdateWorkspaceInput {
  name?: string
}

// ============ INVITES ============

export interface Invite {
  id: string
  workspaceId: string
  email: string
  role: UserRole
  token: string
  expiresAt: number
  createdBy: string
  createdAt: number
  usedAt: number | null
}

export interface CreateInviteInput {
  email: string
  role?: UserRole
}

export interface InviteInfo {
  workspace: Workspace
  email: string
  invitedBy: User | null
}
