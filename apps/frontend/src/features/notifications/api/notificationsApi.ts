import { supabase } from '@/lib/supabaseClient'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  dismissed_permanently: boolean
  next_reminder_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Fetch all notifications for the current user
 */
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { notifications: data as Notification[] | null, error }
}

/**
 * Fetch active notifications (not permanently dismissed)
 *
 * Note: For MVP, we fetch all non-dismissed notifications.
 * The "remind later" feature will filter client-side or be refined later.
 */
export async function getActiveNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('dismissed_permanently', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch notifications:', error)
  }

  return { notifications: data as Notification[] | null, error }
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(userId: string) {
  // Simplified query: count all non-dismissed, unread notifications
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
    .eq('dismissed_permanently', false)

  return { count: count ?? 0, error }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  return { error }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)

  return { error }
}

/**
 * Dismiss notification with "remind me later" (shows again tomorrow)
 */
export async function remindLater(notificationId: string) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0) // Show at 9am next day

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      next_reminder_at: tomorrow.toISOString(),
    })
    .eq('id', notificationId)

  return { error }
}

/**
 * Dismiss notification permanently ("don't remind again")
 */
export async function dismissPermanently(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      dismissed_permanently: true,
    })
    .eq('id', notificationId)

  return { error }
}

/**
 * Delete the profile completion notification (after profile is complete)
 */
export async function deleteProfileReminder(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('type', 'profile_incomplete')

  return { error }
}
