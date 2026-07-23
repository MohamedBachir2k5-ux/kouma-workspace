import type { Notification } from '../lib/types'

// Phase 1: no mock notifications — the list is empty by design.
// Phase 3: supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
const NOTIFICATIONS: Notification[] = []

export const NotificationService = {
  getForUser(_userId: string): Notification[] {
    return NOTIFICATIONS
  },

  getUnreadCount(userId: string): number {
    return NotificationService.getForUser(userId).filter(n => !n.read).length
  },

  markRead(id: string): void {
    // TODO Phase 3: supabase.from('notifications').update({ read: true }).eq('id', id)
    const n = NOTIFICATIONS.find(n => n.id === id)
    if (n) n.read = true
  },

  markAllRead(userId: string): void {
    // TODO Phase 3: supabase.from('notifications').update({ read: true }).eq('user_id', userId)
    NOTIFICATIONS.filter(n => n.userId === userId).forEach(n => { n.read = true })
  },
}
