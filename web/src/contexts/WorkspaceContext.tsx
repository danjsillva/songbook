import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Workspace, User as AppUser } from '@songbook/shared'
import { useAuth } from './AuthContext'

interface WorkspaceState {
  workspace: Workspace | null
  user: AppUser | null
  loading: boolean
  needsOnboarding: boolean
}

interface WorkspaceContextValue extends WorkspaceState {
  refreshWorkspace: () => Promise<void>
  setWorkspace: (workspace: Workspace) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

// Workspace ID cache for API client
let cachedWorkspaceId: string | null = null

export function getWorkspaceId(): string | null {
  return cachedWorkspaceId
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useAuth()
  const [state, setState] = useState<WorkspaceState>({
    workspace: null,
    user: null,
    loading: true,
    needsOnboarding: false,
  })

  const fetchWorkspace = useCallback(async () => {
    if (!firebaseUser) {
      cachedWorkspaceId = null
      setState({
        workspace: null,
        user: null,
        loading: false,
        needsOnboarding: false,
      })
      return
    }

    try {
      // Import api dynamically to avoid circular deps
      const { api } = await import('../api/client')

      // Fetch current user info (includes workspace)
      const user = await api.users.me()

      if (user.workspaceId) {
        // User has a workspace, fetch it
        const workspace = await api.workspaces.getMyWorkspace()
        cachedWorkspaceId = workspace?.id || null

        setState({
          workspace,
          user,
          loading: false,
          needsOnboarding: false,
        })
      } else {
        // User has no workspace, needs onboarding
        cachedWorkspaceId = null
        setState({
          workspace: null,
          user,
          loading: false,
          needsOnboarding: true,
        })
      }
    } catch (err) {
      console.error('[WorkspaceContext] Failed to fetch workspace:', err)
      cachedWorkspaceId = null
      setState({
        workspace: null,
        user: null,
        loading: false,
        needsOnboarding: true,
      })
    }
  }, [firebaseUser])

  // Fetch workspace when auth changes
  useEffect(() => {
    if (authLoading) return
    fetchWorkspace()
  }, [authLoading, fetchWorkspace])

  const setWorkspace = useCallback((workspace: Workspace) => {
    cachedWorkspaceId = workspace.id
    setState(s => ({
      ...s,
      workspace,
      needsOnboarding: false,
    }))
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        ...state,
        refreshWorkspace: fetchWorkspace,
        setWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}
