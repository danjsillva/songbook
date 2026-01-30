import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { usePresence } from '../hooks/usePresence'
import type { UserPresence } from '../../../shared'

interface PresenceContextValue {
  // State
  otherUsers: UserPresence[]
  leader: UserPresence | null
  followingId: string | null
  allowFollowers: boolean
  isConnected: boolean
  // Current user's position state (managed by SongViewer)
  position: number
  sectionIndex: number
  transpose: number
  // Actions
  startFollowing: (userId: string) => Promise<void>
  stopFollowing: () => Promise<void>
  toggleAllowFollowers: () => void
  // Update functions (called by SongViewer)
  updatePosition: (position: number) => void
  updateSectionIndex: (index: number) => void
  updateTranspose: (transpose: number) => void
}

const PresenceContext = createContext<PresenceContextValue | null>(null)

interface PresenceProviderProps {
  children: ReactNode
  workspaceId: string | null
  setlistId: string | null
  userId: string | null
  userName: string | null
  userPhoto: string | null
  initialPosition: number
  initialTranspose: number
}

export function PresenceProvider({
  children,
  workspaceId,
  setlistId,
  userId,
  userName,
  userPhoto,
  initialPosition,
  initialTranspose,
}: PresenceProviderProps) {
  const [position, setPosition] = useState(initialPosition)
  const [sectionIndex, setSectionIndex] = useState(0)
  const [transpose, setTranspose] = useState(initialTranspose)
  const [allowFollowers, setAllowFollowers] = useState(true)

  // Update position when initialPosition changes (navigation)
  useEffect(() => {
    setPosition(initialPosition)
  }, [initialPosition])

  // Update transpose when initialTranspose changes
  useEffect(() => {
    setTranspose(initialTranspose)
  }, [initialTranspose])

  const {
    otherUsers,
    leader,
    followingId,
    startFollowing,
    stopFollowing,
    setAllowFollowers: setAllowFollowersRemote,
    isConnected,
  } = usePresence({
    workspaceId,
    setlistId,
    userId,
    userName,
    userPhoto,
    position,
    sectionIndex,
    transpose,
    allowFollowers,
  })

  const toggleAllowFollowers = useCallback(() => {
    const newValue = !allowFollowers
    setAllowFollowers(newValue)
    setAllowFollowersRemote(newValue)
  }, [allowFollowers, setAllowFollowersRemote])

  const updatePosition = useCallback((pos: number) => {
    setPosition(pos)
  }, [])

  const updateSectionIndex = useCallback((index: number) => {
    setSectionIndex(index)
  }, [])

  const updateTranspose = useCallback((t: number) => {
    setTranspose(t)
  }, [])

  return (
    <PresenceContext.Provider
      value={{
        otherUsers,
        leader,
        followingId,
        allowFollowers,
        isConnected,
        position,
        sectionIndex,
        transpose,
        startFollowing,
        stopFollowing,
        toggleAllowFollowers,
        updatePosition,
        updateSectionIndex,
        updateTranspose,
      }}
    >
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresenceContext() {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresenceContext must be used within PresenceProvider')
  }
  return context
}

// Optional hook that doesn't throw if outside provider
export function usePresenceContextOptional() {
  return useContext(PresenceContext)
}
