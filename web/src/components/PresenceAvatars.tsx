import { useState } from 'react'
import { Users, UserCheck } from 'lucide-react'
import { useClickOutside } from '../hooks/useClickOutside'
import { usePresenceContextOptional } from '../contexts/PresenceContext'
import type { UserPresence } from '../../../shared'

interface AvatarProps {
  user: UserPresence
  isFollowing: boolean
  isCurrentLeader: boolean
  onClick: () => void
}

function Avatar({ user, isFollowing, isCurrentLeader, onClick }: AvatarProps) {
  const initial = user.userName?.[0]?.toUpperCase() || '?'

  return (
    <button
      onClick={onClick}
      className={`
        relative w-8 h-8 rounded-full flex items-center justify-center
        transition-all duration-200 cursor-pointer
        ${isCurrentLeader
          ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary'
          : 'hover:ring-2 hover:ring-border hover:ring-offset-1 hover:ring-offset-bg-secondary'
        }
      `}
      title={`${user.userName || 'Usuario'}${isFollowing ? ' (clique para parar de seguir)' : ' (clique para seguir)'}`}
    >
      {user.userPhoto ? (
        <img
          src={user.userPhoto}
          alt=""
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-text-secondary text-xs font-semibold">
          {initial}
        </div>
      )}
      {/* Position indicator dot */}
      <span
        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-secondary"
        style={{ backgroundColor: user.allowFollowers ? '#22c55e' : '#6b7280' }}
        title={user.allowFollowers ? 'Disponivel para seguir' : 'Nao aceita seguidores'}
      />
    </button>
  )
}

export function PresenceAvatars() {
  const presence = usePresenceContextOptional()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useClickOutside<HTMLDivElement>(() => setShowMenu(false), showMenu)

  if (!presence) return null

  const { otherUsers, followingId, startFollowing, stopFollowing, allowFollowers, toggleAllowFollowers } = presence

  // Filter users that allow followers for display
  const visibleUsers = otherUsers.slice(0, 3) // Show max 3 avatars
  const hiddenCount = otherUsers.length - 3

  if (otherUsers.length === 0) return null

  const handleAvatarClick = async (userId: string) => {
    if (followingId === userId) {
      await stopFollowing()
    } else {
      const user = otherUsers.find(u => u.userId === userId)
      if (user?.allowFollowers) {
        await startFollowing(userId)
      }
    }
  }

  return (
    <div className="flex items-center gap-1" ref={menuRef}>
      {/* Avatar stack */}
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user) => (
          <Avatar
            key={user.userId}
            user={user}
            isFollowing={followingId === user.userId}
            isCurrentLeader={followingId === user.userId}
            onClick={() => handleAvatarClick(user.userId)}
          />
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="relative w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-tertiary text-xs font-semibold hover:bg-surface-hover transition-colors cursor-pointer z-10"
            title={`+${hiddenCount} usuarios`}
          >
            +{hiddenCount}
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border-subtle mx-2" />

      {/* Allow followers toggle */}
      <button
        onClick={toggleAllowFollowers}
        className={`
          w-8 h-8 flex items-center justify-center rounded-lg
          transition-all duration-200 cursor-pointer
          ${allowFollowers
            ? 'bg-accent/10 text-accent hover:bg-accent/20'
            : 'text-text-tertiary hover:bg-surface-hover hover:text-text-secondary'
          }
        `}
        title={allowFollowers ? 'Voce pode ser seguido (clique para desativar)' : 'Voce nao pode ser seguido (clique para ativar)'}
      >
        {allowFollowers ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <Users className="w-4 h-4" />
        )}
      </button>

      {/* Expanded user list menu */}
      {showMenu && hiddenCount > 0 && (
        <div className="absolute right-0 top-full mt-2 bg-bg-elevated border border-border rounded-xl shadow-lg py-2 min-w-[220px] z-50 animate-scale-in">
          <div className="px-4 py-2 border-b border-border-subtle">
            <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
              Usuarios no setlist
            </p>
          </div>
          {otherUsers.map((user) => (
            <button
              key={user.userId}
              onClick={() => {
                handleAvatarClick(user.userId)
                setShowMenu(false)
              }}
              disabled={!user.allowFollowers && followingId !== user.userId}
              className={`
                w-full px-4 py-2.5 text-left text-sm cursor-pointer flex items-center gap-3
                transition-colors duration-150
                ${followingId === user.userId
                  ? 'bg-accent/10'
                  : user.allowFollowers
                    ? 'hover:bg-surface-hover'
                    : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              {user.userPhoto ? (
                <img src={user.userPhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-text-secondary text-xs font-semibold">
                  {user.userName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary truncate">{user.userName || 'Usuario'}</p>
                <p className="text-xs text-text-tertiary">
                  Musica {user.position + 1}
                  {!user.allowFollowers && ' • Nao aceita seguidores'}
                </p>
              </div>
              {followingId === user.userId && (
                <span className="text-xs text-accent font-medium">Seguindo</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
