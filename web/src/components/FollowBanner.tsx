import { X } from 'lucide-react'
import { usePresenceContextOptional } from '../contexts/PresenceContext'

export function FollowBanner() {
  const presence = usePresenceContextOptional()

  if (!presence) return null

  const { leader, stopFollowing } = presence

  if (!leader) return null

  const initial = leader.userName?.[0]?.toUpperCase() || '?'

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 animate-slide-down">
      <div className="flex items-center gap-3 bg-accent/10 backdrop-blur-lg border border-accent/20 rounded-full px-4 py-2 shadow-lg">
        {/* Avatar */}
        {leader.userPhoto ? (
          <img
            src={leader.userPhoto}
            alt=""
            className="w-6 h-6 rounded-full object-cover ring-2 ring-accent"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-bg-primary text-xs font-semibold ring-2 ring-accent/50">
            {initial}
          </div>
        )}

        {/* Text */}
        <span className="text-sm text-text-primary">
          Seguindo <span className="font-semibold text-accent">{leader.userName || 'Usuario'}</span>
        </span>

        {/* Stop button */}
        <button
          onClick={stopFollowing}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
          title="Parar de seguir"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
