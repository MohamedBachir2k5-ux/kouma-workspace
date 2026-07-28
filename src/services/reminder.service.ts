import { supabase } from '../lib/supabase'

export interface EventReminder {
  id: string
  eventId: string
  userId: string
  remindAt: string
  sent: boolean
  createdAt: string
}

type ReminderRow = {
  id: string
  event_id: string
  user_id: string
  remind_at: string
  sent: boolean
  created_at: string
}

function rowToReminder(r: ReminderRow): EventReminder {
  return {
    id: r.id,
    eventId: r.event_id,
    userId: r.user_id,
    remindAt: r.remind_at,
    sent: r.sent,
    createdAt: r.created_at,
  }
}

export const ReminderService = {
  async getForUser(userId: string): Promise<EventReminder[]> {
    const { data } = await supabase
      .from('event_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('sent', false)
      .gte('remind_at', new Date().toISOString())
      .order('remind_at', { ascending: true })
    return ((data ?? []) as unknown as ReminderRow[]).map(rowToReminder)
  },

  async getForEvent(eventId: string, userId: string): Promise<EventReminder | null> {
    const { data } = await supabase
      .from('event_reminders')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()
    return data ? rowToReminder(data as unknown as ReminderRow) : null
  },

  async set(eventId: string, userId: string, remindAt: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('event_reminders')
      .upsert({ event_id: eventId, user_id: userId, remind_at: remindAt, sent: false })
    return { error: error?.message ?? null }
  },

  async cancel(eventId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('event_reminders')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
    return { error: error?.message ?? null }
  },

  // Called by a background job or cron — marks reminder as sent and notifies user
  async processDue(): Promise<void> {
    const { data: due } = await supabase
      .from('event_reminders')
      .select('id, event_id, user_id, events(title)')
      .eq('sent', false)
      .lte('remind_at', new Date().toISOString())

    if (!due?.length) return

    for (const r of due as unknown as Array<{ id: string; event_id: string; user_id: string; events: { title: string } | null }>) {
      await supabase.rpc('notify_users', {
        p_user_ids: [r.user_id],
        p_type: 'event_reminder',
        p_payload: {
          text: `Rappel : « ${r.events?.title ?? 'Réunion'} » commence bientôt.`,
          eventId: r.event_id,
        },
      })
      await supabase.from('event_reminders').update({ sent: true }).eq('id', r.id)
    }
  },
}
