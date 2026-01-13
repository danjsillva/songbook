import { useEffect } from 'react'
import { useUser } from '../hooks/useUser'

interface AuthorBadgeProps {
  userId: string | null
  size?: 'sm' | 'md'
}

export function AuthorBadge({ userId, size = 'sm' }: AuthorBadgeProps) {
  const { user, loading } = useUser(userId)

  // Debug logging
  useEffect(() => {
    if (userId) {
      console.log('[AuthorBadge] userId:', userId, 'loading:', loading, 'user:', user)
    }
  }, [userId, loading, user])

  if (!userId || loading) {
    return null
  }

  if (!user) {
    console.warn('[AuthorBadge] User not found for userId:', userId)
    return null
  }

  const sizeClasses = size === 'sm'
    ? 'w-6 h-6 text-xs'
    : 'w-7 h-7 text-sm'

  return (
    <div className="flex items-center gap-2 text-text-tertiary">
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.name || 'User'}
          className={`${sizeClasses} rounded-lg object-cover`}
        />
      ) : (
        <div className={`${sizeClasses} rounded-lg bg-accent flex items-center justify-center text-bg-primary font-semibold`}>
          {user.name?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      {size === 'md' && user.name && (
        <span className="text-sm text-text-secondary">{user.name}</span>
      )}
    </div>
  )
}
