import { useUser } from '../hooks/useUser'

interface AuthorBadgeProps {
  userId: string | null
  size?: 'sm' | 'md'
}

export function AuthorBadge({ userId, size = 'sm' }: AuthorBadgeProps) {
  const { user, loading } = useUser(userId)

  if (!userId || loading) {
    return null
  }

  if (!user) {
    return null
  }

  const sizeClasses = size === 'sm'
    ? 'w-5 h-5 text-xs'
    : 'w-6 h-6 text-sm'

  return (
    <div className="flex items-center gap-1.5 text-neutral-400">
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.name || 'User'}
          className={`${sizeClasses} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizeClasses} rounded-full bg-neutral-700 flex items-center justify-center`}>
          {user.name?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      {size === 'md' && user.name && (
        <span className="text-sm">{user.name}</span>
      )}
    </div>
  )
}
