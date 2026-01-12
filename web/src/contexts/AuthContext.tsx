import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
  token: string | null
}

interface AuthContextValue extends AuthState {
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Token cache to avoid unnecessary getIdToken calls
let cachedToken: string | null = null
let tokenExpiry: number = 0

export function getAuthToken(): string | null {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    token: null,
  })

  // Initialize auth listener - runs once on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const initAuth = async () => {
      try {
        const { getFirebaseAuth } = await import('../lib/firebase')
        const { auth } = await getFirebaseAuth()
        const { onAuthStateChanged } = await import('firebase/auth')

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const token = await user.getIdToken()
            cachedToken = token
            // Token expires in 1 hour, refresh 5 min before
            tokenExpiry = Date.now() + 55 * 60 * 1000
            setState({ user, loading: false, token })

            // Sync user profile to our backend
            try {
              const { api } = await import('../api/client')
              await api.users.sync({
                name: user.displayName,
                email: user.email,
                photoUrl: user.photoURL,
              })
            } catch {
              // Sync failed, non-critical
            }
          } else {
            cachedToken = null
            tokenExpiry = 0
            setState({ user: null, loading: false, token: null })
          }
        })
      } catch {
        // Firebase not configured or failed to load
        setState({ user: null, loading: false, token: null })
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Refresh token periodically if user is logged in
  useEffect(() => {
    if (!state.user) return

    const refreshToken = async () => {
      try {
        const token = await state.user!.getIdToken(true)
        cachedToken = token
        tokenExpiry = Date.now() + 55 * 60 * 1000
        setState((s) => ({ ...s, token }))
      } catch {
        // Token refresh failed, will retry next interval
      }
    }

    // Refresh every 50 minutes
    const interval = setInterval(refreshToken, 50 * 60 * 1000)
    return () => clearInterval(interval)
  }, [state.user])

  const signIn = useCallback(async () => {
    const { getFirebaseAuth } = await import('../lib/firebase')
    const { auth, provider } = await getFirebaseAuth()
    const { signInWithPopup } = await import('firebase/auth')
    await signInWithPopup(auth, provider)
  }, [])

  const signOut = useCallback(async () => {
    const { getFirebaseAuth } = await import('../lib/firebase')
    const { auth } = await getFirebaseAuth()
    const { signOut: firebaseSignOut } = await import('firebase/auth')
    await firebaseSignOut(auth)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
