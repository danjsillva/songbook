import type { Song } from '@songbook/shared'
import { api } from '../api/client'

// Cache simples em memória - limitado a 1 setlist por vez
const cache = new Map<string, Song>()

// Listeners para notificar quando uma música é atualizada em background
type UpdateListener = (id: string, song: Song) => void
const listeners = new Set<UpdateListener>()

export const songCache = {
  get(id: string): Song | undefined {
    return cache.get(id)
  },

  set(id: string, song: Song): void {
    cache.set(id, song)
  },

  has(id: string): boolean {
    return cache.has(id)
  },

  invalidate(id: string): void {
    cache.delete(id)
  },

  clear(): void {
    cache.clear()
  },

  // Subscribe para atualizações de background
  subscribe(listener: UpdateListener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  // Notifica listeners quando música é atualizada
  _notifyUpdate(id: string, song: Song): void {
    listeners.forEach(listener => listener(id, song))
  },

  // Prefetch para setlist - carrega músicas que ainda não estão no cache
  async prefetchSetlist(ids: string[]): Promise<void> {
    // Filtra apenas as que não estão no cache
    const missingIds = ids.filter(id => !cache.has(id))

    if (missingIds.length === 0) return

    // Carrega apenas as que faltam em paralelo
    const results = await Promise.allSettled(
      missingIds.map(id => api.songs.get(id))
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        cache.set(missingIds[index], result.value)
      }
    })
  },

  // Carrega com stale-while-revalidate
  // Retorna cache instantâneo, mas revalida em background
  async load(id: string, onUpdate?: (song: Song) => void): Promise<Song> {
    const cached = cache.get(id)

    if (cached) {
      // Retorna instantâneo, mas revalida em background
      this._revalidateInBackground(id, cached, onUpdate)
      return cached
    }

    // Não está no cache - carrega normalmente
    const song = await api.songs.get(id)
    cache.set(id, song)
    return song
  },

  // Revalida em background e atualiza se mudou
  async _revalidateInBackground(id: string, cached: Song, onUpdate?: (song: Song) => void): Promise<void> {
    try {
      const fresh = await api.songs.get(id)

      // Detecta mudanças comparando campos relevantes
      const hasChanged =
        fresh.plainText !== cached.plainText ||
        fresh.title !== cached.title ||
        fresh.artist !== cached.artist ||
        fresh.originalKey !== cached.originalKey ||
        fresh.bpm !== cached.bpm

      if (hasChanged) {
        cache.set(id, fresh)
        // Notifica o componente que a música foi atualizada
        if (onUpdate) {
          onUpdate(fresh)
        }
        this._notifyUpdate(id, fresh)
      }
    } catch {
      // Falha silenciosa - já temos o cache
    }
  }
}
