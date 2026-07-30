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

  async markAllByConversation(userId: string, conversationId: string): Promise<void> {
    const { data: toMark } = await supabase
      .from('notifications')
      .select('id, payload')
      .eq('user_id', userId)
      .eq('type', 'new_message')
      .eq('read', false)
    if (!toMark || toMark.length === 0) return
    const ids = toMark
      .filter(r => String((r.payload as Record<string, unknown>)?.conversationId) === conversationId)
      .map(r => r.id)
    if (ids.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
  },
}

export type NotifPrefType = 'new_message' | 'meeting_invite' | 'team_update' | 'announcement' | 'document_shared'

export interface NotifPref {
  type: NotifPrefType
  push: boolean
  inapp: boolean
}

export const NotifPrefService = {
  async getAll(userId: string, orgId: string): Promise<NotifPref[]> {
    const { data } = await supabase
      .from('user_notification_preferences')
      .select('type, push, inapp')
      .eq('user_id', userId)
      .eq('org_id', orgId)
    return (data ?? []) as NotifPref[]
  },

  async upsert(userId: string, orgId: string, type: NotifPrefType, push: boolean, inapp: boolean): Promise<void> {
    await supabase.from('user_notification_preferences').upsert(
      { user_id: userId, org_id: orgId, type, push, inapp },
      { onConflict: 'user_id,org_id,type' }
    )
  },
}
