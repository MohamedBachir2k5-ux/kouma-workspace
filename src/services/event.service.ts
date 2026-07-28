import { supabase } from '../lib/supabase'
import type { Event, EventStatus } from '../lib/types'
import { devlog } from '../lib/devlog'

type EventRow = {
  id: string
  organization_id: string
  title: string
  description: string | null
  location: string | null
  external_link: string | null
  start_at: string
  end_at: string
  participants: string[]
  created_by: string
  created_at: string
  status: string
  modified_at: string | null
  cancel_reason: string | null
  rsvp: Record<string, 'accepted' | 'declined' | 'pending'> | null
}

function rowToEvent(r: EventRow): Event {
  return {
    id: r.id,
    organizationId: r.organization_id,
    title: r.title,
    description: r.description ?? undefined,
    location: r.location ?? undefined,
    externalLink: r.external_link ?? undefined,
    startAt: r.start_at,
    endAt: r.end_at,
    participants: r.participants,
    createdById: r.created_by,
    createdAt: r.created_at,
    status: r.status as EventStatus,
    modifiedAt: r.modified_at ?? undefined,
    cancelReason: r.cancel_reason ?? undefined,
    rsvp: r.rsvp ?? undefined,
  }
}

export const EventService = {
  async list(orgId: string): Promise<Event[]> {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', orgId)
      .order('start_at', { ascending: true })
    return (data ?? []).map(r => rowToEvent(r as unknown as EventRow))
  },

  async getForUser(orgId: string, userId: string): Promise<Event[]> {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', orgId)
      .contains('participants', [userId])
      .order('start_at', { ascending: true })
    return (data ?? []).map(r => rowToEvent(r as unknown as EventRow))
  },

  async create(data: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    const { data: row, error } = await supabase
      .from('events')
      .insert({
        organization_id: data.organizationId,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        external_link: data.externalLink ?? null,
        start_at: data.startAt,
        end_at: data.endAt,
        participants: data.participants,
        created_by: data.createdById,
        status: data.status ?? 'scheduled',
        cancel_reason: data.cancelReason ?? null,
      })
      .select()
      .single()

    if (error || !row) { devlog.supabaseError('EventService', 'create', 'events', error); throw new Error(error?.message ?? 'Erreur lors de la création.') }

    // Notify all participants (except the creator) via SECURITY DEFINER RPC
    const others = data.participants.filter(id => id !== data.createdById)
    if (others.length > 0) {
      const start = new Date(data.startAt)
      const dateStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      const timeStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      await supabase.rpc('notify_users', {
        p_user_ids: others,
        p_type: 'meeting_invite',
        p_payload: {
          text: `Vous avez été invité à la réunion "${data.title}" le ${dateStr} à ${timeStr}.`,
          eventId: (row as unknown as EventRow).id,
        },
      })
    }

    const created = rowToEvent(row as unknown as EventRow)

    // Audit log
    await supabase.from('audit_logs').insert({
      organization_id: data.organizationId,
      user_id: data.createdById,
      action: 'event_created',
      target_id: created.id,
      target_name: data.title,
    }).then(() => {})  // fire-and-forget, don't block return

    return created
  },

  async update(id: string, updates: Partial<Event>, orgId?: string, actorId?: string): Promise<void> {
    let q = supabase.from('events').update({
      ...(updates.title !== undefined       ? { title: updates.title } : {}),
      ...(updates.description !== undefined ? { description: updates.description ?? null } : {}),
      ...(updates.location !== undefined    ? { location: updates.location ?? null } : {}),
      ...(updates.externalLink !== undefined ? { external_link: updates.externalLink ?? null } : {}),
      ...(updates.startAt !== undefined     ? { start_at: updates.startAt } : {}),
      ...(updates.endAt !== undefined       ? { end_at: updates.endAt } : {}),
      ...(updates.participants !== undefined ? { participants: updates.participants } : {}),
      status: updates.status ?? 'modified',
      modified_at: new Date().toISOString(),
    }).eq('id', id)
    if (orgId) q = q.eq('organization_id', orgId)
    await q

    // Notify participants (except actor) of the change
    if (updates.participants?.length && actorId) {
      const others = updates.participants.filter(uid => uid !== actorId)
      if (others.length > 0) {
        const title = updates.title ?? 'Réunion'
        await supabase.rpc('notify_users', {
          p_user_ids: others,
          p_type: 'meeting_invite',
          p_payload: { text: `La réunion "${title}" a été modifiée.`, eventId: id },
        })
      }
    }
  },

  async cancel(id: string, reason: string, orgId?: string, actorId?: string): Promise<void> {
    const { data: current } = await supabase
      .from('events')
      .select('title, participants')
      .eq('id', id)
      .single()

    let q = supabase
      .from('events')
      .update({ status: 'cancelled', cancel_reason: reason, modified_at: new Date().toISOString() })
      .eq('id', id)
    if (orgId) q = q.eq('organization_id', orgId)
    await q

    // Notify all participants (except actor) that the event is cancelled
    if (current && actorId) {
      const others = (current.participants as string[]).filter(uid => uid !== actorId)
      if (others.length > 0) {
        await supabase.rpc('notify_users', {
          p_user_ids: others,
          p_type: 'meeting_invite',
          p_payload: { text: `La réunion "${current.title}" a été annulée.${reason ? ` Raison : ${reason}` : ''}`, eventId: id },
        })
      }
    }
  },

  async markDone(id: string, orgId?: string): Promise<void> {
    let q = supabase
      .from('events')
      .update({ status: 'done', modified_at: new Date().toISOString() })
      .eq('id', id)
    if (orgId) q = q.eq('organization_id', orgId)
    await q
  },

  async updateStatus(id: string, status: EventStatus, orgId?: string): Promise<void> {
    let q = supabase
      .from('events')
      .update({ status, modified_at: new Date().toISOString() })
      .eq('id', id)
    if (orgId) q = q.eq('organization_id', orgId)
    await q
  },

  async delete(id: string, orgId?: string): Promise<void> {
    let q = supabase.from('events').delete().eq('id', id)
    if (orgId) q = q.eq('organization_id', orgId)
    await q
  },

  async respondToEvent(eventId: string, userId: string, response: 'accepted' | 'declined'): Promise<void> {
    const { data: current } = await supabase
      .from('events')
      .select('rsvp')
      .eq('id', eventId)
      .single()
    const rsvp = { ...((current?.rsvp as Record<string, string>) ?? {}), [userId]: response }
    await supabase.from('events').update({ rsvp }).eq('id', eventId)
  },
}
