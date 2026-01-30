import { useEffect, useRef, useCallback, useState } from 'react'
import {
  ref,
  set,
  onValue,
  onDisconnect,
  off,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database'
import { getFirebaseDatabase } from '../lib/firebase'
import type { UserPresence, FollowingState } from '../../../shared'

interface UsePresenceOptions {
  workspaceId: string | null
  setlistId: string | null
  userId: string | null
  userName: string | null
  userPhoto: string | null
  position: number
  sectionIndex: number
  transpose: number
  allowFollowers: boolean
}

interface UsePresenceReturn {
  // All users present in the setlist (excluding self)
  otherUsers: UserPresence[]
  // The leader being followed (if any)
  leader: UserPresence | null
  // Who we're following
  followingId: string | null
  // Actions
  startFollowing: (userId: string) => Promise<void>
  stopFollowing: () => Promise<void>
  setAllowFollowers: (allow: boolean) => Promise<void>
  // Status
  isConnected: boolean
}

export function usePresence(options: UsePresenceOptions): UsePresenceReturn {
  const {
    workspaceId,
    setlistId,
    userId,
    userName,
    userPhoto,
    position,
    sectionIndex,
    transpose,
    allowFollowers,
  } = options

  const [otherUsers, setOtherUsers] = useState<UserPresence[]>([])
  const [followingId, setFollowingId] = useState<string | null>(null)
  const [leader, setLeader] = useState<UserPresence | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const dbRef = useRef<Awaited<ReturnType<typeof getFirebaseDatabase>> | null>(null)
  const presenceUnsubscribe = useRef<Unsubscribe | null>(null)
  const followingUnsubscribe = useRef<Unsubscribe | null>(null)
  const leaderUnsubscribe = useRef<Unsubscribe | null>(null)

  // Initialize database
  useEffect(() => {
    let mounted = true
    console.log('[usePresence] Initializing database...')
    getFirebaseDatabase().then((db) => {
      if (mounted) {
        console.log('[usePresence] Database connected:', db)
        dbRef.current = db
        setIsConnected(true)
      }
    }).catch((err) => {
      console.error('[usePresence] Database connection failed:', err)
    })
    return () => {
      mounted = false
    }
  }, [])

  // Build paths
  const presencePath = workspaceId && setlistId
    ? `presence/${workspaceId}/${setlistId}`
    : null
  const userPresencePath = presencePath && userId
    ? `${presencePath}/${userId}`
    : null
  const followingPath = workspaceId && userId
    ? `following/${workspaceId}/${userId}`
    : null

  // Publish own presence
  useEffect(() => {
    console.log('[usePresence] Publish effect:', { isConnected, dbRef: !!dbRef.current, userPresencePath, userId })
    if (!isConnected || !dbRef.current || !userPresencePath || !userId) return

    const presenceRef = ref(dbRef.current, userPresencePath)

    const presence: Omit<UserPresence, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
      userId,
      position,
      sectionIndex,
      transpose,
      allowFollowers,
      userName,
      userPhoto,
      updatedAt: serverTimestamp(),
    }

    console.log('[usePresence] Publishing presence:', userPresencePath, presence)
    // Set presence
    set(presenceRef, presence)
      .then(() => console.log('[usePresence] Presence published successfully'))
      .catch((err) => console.error('[usePresence] Failed to publish presence:', err))

    // Setup onDisconnect to remove presence when user leaves
    onDisconnect(presenceRef).remove()
  }, [isConnected, userPresencePath, userId, position, sectionIndex, transpose, allowFollowers, userName, userPhoto])

  // Cleanup presence on unmount only
  useEffect(() => {
    return () => {
      if (dbRef.current && userPresencePath) {
        const presenceRef = ref(dbRef.current, userPresencePath)
        set(presenceRef, null)
      }
    }
  }, [userPresencePath])

  // Subscribe to all presence in setlist
  useEffect(() => {
    if (!isConnected || !dbRef.current || !presencePath || !userId) return

    const presenceRef = ref(dbRef.current, presencePath)

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        setOtherUsers([])
        return
      }

      const users: UserPresence[] = Object.values(data)
        .filter((u): u is UserPresence => {
          const user = u as UserPresence
          return user.userId !== userId && typeof user.updatedAt === 'number'
        })
        // Filter out stale presence (older than 5 minutes)
        .filter((u) => {
          const age = Date.now() - u.updatedAt
          return age < 5 * 60 * 1000
        })

      setOtherUsers(users)
    })

    presenceUnsubscribe.current = () => off(presenceRef)

    return () => {
      off(presenceRef)
      presenceUnsubscribe.current = null
    }
  }, [isConnected, presencePath, userId])

  // Subscribe to own following state
  useEffect(() => {
    if (!isConnected || !dbRef.current || !followingPath) return

    const followingRef = ref(dbRef.current, followingPath)

    const unsubscribe = onValue(followingRef, (snapshot) => {
      const data = snapshot.val() as FollowingState | null
      if (!data || data.setlistId !== setlistId) {
        setFollowingId(null)
      } else {
        setFollowingId(data.leaderId)
      }
    })

    followingUnsubscribe.current = () => off(followingRef)

    return () => {
      off(followingRef)
      followingUnsubscribe.current = null
    }
  }, [isConnected, followingPath, setlistId])

  // Subscribe to leader's presence when following
  useEffect(() => {
    if (!isConnected || !dbRef.current || !presencePath || !followingId) {
      setLeader(null)
      return
    }

    const leaderRef = ref(dbRef.current, `${presencePath}/${followingId}`)

    const unsubscribe = onValue(leaderRef, (snapshot) => {
      const data = snapshot.val() as UserPresence | null
      if (!data) {
        // Leader left
        setLeader(null)
        // Stop following if leader leaves
        if (followingPath && dbRef.current) {
          set(ref(dbRef.current, followingPath), null)
        }
      } else if (!data.allowFollowers) {
        // Leader disabled followers
        setLeader(null)
        if (followingPath && dbRef.current) {
          set(ref(dbRef.current, followingPath), null)
        }
      } else {
        setLeader(data)
      }
    })

    leaderUnsubscribe.current = () => off(leaderRef)

    return () => {
      off(leaderRef)
      leaderUnsubscribe.current = null
    }
  }, [isConnected, presencePath, followingId, followingPath])

  // Actions
  const startFollowing = useCallback(async (targetUserId: string) => {
    if (!dbRef.current || !followingPath || !setlistId) return

    const followingRef = ref(dbRef.current, followingPath)
    const followingState: FollowingState = {
      leaderId: targetUserId,
      setlistId,
    }
    await set(followingRef, followingState)
  }, [followingPath, setlistId])

  const stopFollowing = useCallback(async () => {
    if (!dbRef.current || !followingPath) return

    const followingRef = ref(dbRef.current, followingPath)
    await set(followingRef, null)
  }, [followingPath])

  const setAllowFollowersAction = useCallback(async (allow: boolean) => {
    if (!dbRef.current || !userPresencePath) return

    const allowRef = ref(dbRef.current, `${userPresencePath}/allowFollowers`)
    await set(allowRef, allow)
  }, [userPresencePath])

  return {
    otherUsers,
    leader,
    followingId,
    startFollowing,
    stopFollowing,
    setAllowFollowers: setAllowFollowersAction,
    isConnected,
  }
}
