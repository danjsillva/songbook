import { useState, useEffect, useCallback } from 'react'
import type { Song } from '@songbook/shared'
import { api } from '../api/client'

export function useSong(id: string | null) {
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => {
    setVersion(v => v + 1)
  }, [])

  useEffect(() => {
    if (!id) {
      setSong(null)
      return
    }

    const loadSong = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.songs.get(id)
        setSong(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar música')
        setSong(null)
      } finally {
        setLoading(false)
      }
    }

    loadSong()
  }, [id, version])

  return { song, loading, error, refetch }
}
