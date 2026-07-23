import type { Event, EventStatus } from '../lib/types'
import { mockEvents } from '../lib/mock'

export const EventService = {
  /** All events for an organisation. */
  list(orgId: string): Event[] {
    // TODO Phase 3: supabase.from('events').select('*, event_participants(*)').eq('organization_id', orgId)
    return mockEvents.filter(e => e.organizationId === orgId)
  },

  /** Events where the user is a participant. */
  getForUser(orgId: string, userId: string): Event[] {
    return EventService.list(orgId).filter(e => e.participants.includes(userId))
  },

  /** Create a new event. Returns the created event. */
  create(data: Omit<Event, 'id' | 'createdAt'>): Event {
    // TODO Phase 3: supabase.from('events').insert(data)
    return { ...data, id: `e${Date.now()}`, createdAt: new Date().toISOString() }
  },

  /** Update event fields. */
  update(id: string, data: Partial<Event>): void {
    // TODO Phase 3: supabase.from('events').update(data).eq('id', id)
    void id; void data
  },

  /** Cancel an event with a reason. */
  cancel(id: string, reason: string): void {
    // TODO Phase 3: supabase.from('events').update({ status: 'cancelled', cancel_reason: reason }).eq('id', id)
    void id; void reason
  },

  /** Mark a past event as done. */
  markDone(id: string): void {
    // TODO Phase 3: supabase.from('events').update({ status: 'done' }).eq('id', id)
    void id
  },

  updateStatus(id: string, status: EventStatus): void {
    EventService.update(id, { status })
  },
}
