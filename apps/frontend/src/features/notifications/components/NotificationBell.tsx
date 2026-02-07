import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '@/features/auth/components/AuthContext'
import { getUnreadCount } from '../api/notificationsApi'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return

    getUnreadCount(user.id).then(({ count }) => {
      setUnreadCount(count)
    })
  }, [user?.id])

  const handleClick = () => {
    navigate('/app/notifications')
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-[var(--radius-button)] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,229,138,0.18)]"
      aria-label="Notifications"
    >
      <Bell className="w-6 h-6 text-[var(--text-secondary)]" />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[var(--error)] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
