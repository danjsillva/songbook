// Posição de um acorde em relação à letra
export interface ChordPosition {
  chord: string    // Ex: "Am7", "G/B", "C#m"
  position: number // Índice do caractere na linha de letra
}

// Linha do modelo canônico
export interface SongLine {
  lyrics: string
  chords: ChordPosition[]
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
}

// Para listagem
export interface SetlistListItem {
  id: string
  name: string
  date: string
  songCount: number
  createdAt: number
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
