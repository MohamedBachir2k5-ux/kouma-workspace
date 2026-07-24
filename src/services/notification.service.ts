import { supabase } from '../lib/supabase'
import type { Notification } from '../lib/types'

function rowToNotification(r: {
  id: string; user_id: string; type: string
  payload: Record<string, unknown> | null; read: boolean; created_at: string
}): Notification {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    payload: r.payload,
    read: r.read,
    createdAt: r.created_at,
  }
}

export const NotificationService = {
  async getForUser(userId: string): Promise<Notification[]> {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return (data ?? []).map(r => rowToNotification(r as Parameters<typeof rowToNotification>[0]))
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    return count ?? 0
  },

  async markRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  },

  async markAllRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  },
}
