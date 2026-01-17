// Posição de um acorde em relação à letra
export interface ChordPosition {
  chord: string    // Ex: "Am7", "G/B", "C#m"
  position: number // Índice do caractere na linha de letra
}

// Remove acentos e normaliza texto para comparação
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[-\s]+/g, '') // Remove hífens e espaços
}

// Retorna cor hex baseada no tipo de seção (cores neon)
export function getSectionColor(section: string): string {
  const s = normalizeText(section)

  // Intro, Introdução → Laranja neon
  if (s.includes('intro') || s.includes('introducao')) {
    return '#FF6B00'
  }

  // Pré-refrão, Pre-chorus → Rosa bebê/rosé (verificar ANTES de refrão)
  if (s.includes('prerefrao') || s.includes('prechorus')) {
    return '#FFB6C1'
  }

  // Refrão, Chorus → Magenta neon
  if (s.includes('refrao') || s.includes('chorus')) {
    return '#FF00FF'
  }

  // Verso, Estrofe, Parte → Ciano neon
  if (s.includes('verso') || s.includes('estrofe') || s.includes('parte') || s.includes('verse')) {
    return '#00E5FF'
  }

  // Instrumental, Solo → Vermelho neon
  if (s.includes('instrumental') || s.includes('solo')) {
    return '#FF1744'
  }

  // Ponte, Bridge → Verde marca texto
  if (s.includes('ponte') || s.includes('bridge')) {
    return '#BFFF00'
  }

  // Resto → Branco
  return '#FFFFFF'
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
