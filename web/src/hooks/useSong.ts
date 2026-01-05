import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song } from '@songbook/shared'
import { songCache } from '../cache/songCache'

export function useSong(id: string | null) {
  // Estado inicial: se já está no cache, usa direto (zero loading)
  const [song, setSong] = useState<Song | null>(() => {
    if (id) return songCache.get(id) ?? null
    return null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const currentIdRef = useRef(id)

  const refetch = useCallback(() => {
    if (id) songCache.invalidate(id)
    setVersion(v => v + 1)
  }, [id])

  useEffect(() => {
    currentIdRef.current = id

    if (!id) {
      setSong(null)
      setLoading(false)
      return
    }

    // Verifica cache primeiro - retorno INSTANTÂNEO se disponível
    const cached = songCache.get(id)
    if (cached) {
      setSong(cached)
      setLoading(false)
      setError(null)

      // Stale-while-revalidate: revalida em background
      songCache._revalidateInBackground(id, cached, (freshSong) => {
        // Atualiza apenas se ainda estamos vendo esta música
        if (currentIdRef.current === id) {
          setSong(freshSong)
        }
      })
      return
    }

    // Não está no cache - precisa carregar
    const loadSong = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await songCache.load(id)
        // Verifica se o id ainda é o mesmo (evita race condition)
        if (currentIdRef.current === id) {
          setSong(data)
        }
      } catch (err) {
        if (currentIdRef.current === id) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar música')
          setSong(null)
        }
      } finally {
        if (currentIdRef.current === id) {
          setLoading(false)
        }
      }
    }

    loadSong()
  }, [id, version])

  return { song, loading, error, refetch }
}
