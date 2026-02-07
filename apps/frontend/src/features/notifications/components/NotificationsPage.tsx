import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthContext'
import {
  getActiveNotifications,
  markAsRead,
  remindLater,
  dismissPermanently,
  type Notification,
} from '../api/notificationsApi'

/**
 * NotificationsPage - Displays user notifications with action buttons.
 *
 * Features:
 * - Lists all active notifications (not permanently dismissed, due to show)
 * - Mark as read: Marks notification as seen but keeps it visible
 * - Remind me later: Hides notification, shows again tomorrow
 * - Don't remind again: Permanently dismisses notification
 *
 * Route: /app/notifications
 */
export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch notifications on mount
  useEffect(() => {
    if (!user?.id) return

    getActiveNotifications(user.id).then(({ notifications: data }) => {
      setNotifications(data ?? [])
      setLoading(false)
    })
  }, [user?.id])

  // Mark a single notification as read (keeps it in the list)
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  // Snooze notification - hides it and shows again tomorrow at 9am
  const handleRemindLater = async (id: string) => {
    await remindLater(id)
    // Remove from current list (will reappear tomorrow)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Permanently dismiss - user won't see this notification again
  const handleDismiss = async (id: string) => {
    await dismissPermanently(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <h1 className="rl-h2 mb-4">Notifications</h1>
        <p className="text-[var(--text-muted)]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="rl-h2 mb-4">Notifications</h1>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <p className="text-[var(--text-muted)]">No notifications</p>
      ) : (
        // Notification list
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={[
                'rl-card p-4',
                notification.read ? 'opacity-80' : '!border-[rgba(246,194,28,0.45)]',
              ].join(' ')}
            >
              {/* Notification content */}
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{notification.message}</p>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => handleRemindLater(notification.id)}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                >
                  Remind me later
                </button>
                <button
                  onClick={() => handleDismiss(notification.id)}
                  className="text-sm text-[var(--error)] hover:underline"
                >
                  Don't remind again
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
