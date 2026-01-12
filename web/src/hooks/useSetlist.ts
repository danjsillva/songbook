import { useState, useEffect, useCallback, useRef } from 'react'
import type { Setlist } from '@songbook/shared'
import { api } from '../api/client'

export function useSetlist(id: string | null) {
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const currentIdRef = useRef(id)

  const refetch = useCallback(() => {
    setVersion(v => v + 1)
  }, [])

  useEffect(() => {
    currentIdRef.current = id

    if (!id) {
      setSetlist(null)
      setLoading(false)
      return
    }

    const loadSetlist = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.setlists.get(id)
        if (currentIdRef.current === id) {
          setSetlist(data)
        }
      } catch (err) {
        if (currentIdRef.current === id) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar setlist')
          setSetlist(null)
        }
      } finally {
        if (currentIdRef.current === id) {
          setLoading(false)
        }
      }
    }

    loadSetlist()
  }, [id, version])

  return { setlist, loading, error, refetch }
}
