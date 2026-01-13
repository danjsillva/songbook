import { useState, useEffect } from 'react'
import type { User } from '@songbook/shared'
import { api } from '../api/client'

// Simple in-memory cache for users
const userCache = new Map<string, User>()
const pendingFetches = new Map<string, Promise<User | null>>()

export function useUser(userId: string | null) {
  const [user, setUser] = useState<User | null>(() => {
    if (userId) return userCache.get(userId) ?? null
    return null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setUser(null)
      setLoading(false)
      return
    }

    // Check cache
    const cached = userCache.get(userId)
    if (cached) {
      setUser(cached)
      setLoading(false)
      return
    }

    // Check if already fetching
    const pending = pendingFetches.get(userId)
    if (pending) {
      setLoading(true)
      pending.then(result => {
        setUser(result)
        setLoading(false)
      })
      return
    }

    // Fetch user
    setLoading(true)
    const fetchPromise = api.users.get(userId)
      .then(user => {
        console.log('[useUser] Fetched user:', userId, user)
        userCache.set(userId, user)
        return user
      })
      .catch((err) => {
        console.error('[useUser] Failed to fetch user:', userId, err)
        return null
      })
      .finally(() => {
        pendingFetches.delete(userId)
      })

    pendingFetches.set(userId, fetchPromise)

    fetchPromise.then(result => {
      setUser(result)
      setLoading(false)
    })
  }, [userId])

  return { user, loading }
}

// Batch fetch users and cache them
export async function prefetchUsers(userIds: string[]): Promise<void> {
  const uncached = userIds.filter(id => !userCache.has(id))
  if (uncached.length === 0) return

  try {
    const users = await api.users.getMany(uncached)
    users.forEach(user => userCache.set(user.id, user))
  } catch {
    // Ignore errors
  }
}
