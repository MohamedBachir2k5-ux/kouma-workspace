import { supabase } from '../lib/supabase'
import { serviceError, friendlyError } from '../lib/errors'
import i18n from '../i18n'
import type { MeetingMinutes, MeetingAction } from '../lib/types'

function toMinutes(row: Record<string, unknown>, actions: MeetingAction[] = []): MeetingMinutes {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    organizationId: row.organization_id as string,
    conversationId: (row.conversation_id as string | null) ?? null,
    createdBy: row.created_by as string,
    title: row.title as string,
    objective: (row.objective as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    decisions: (row.decisions as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    participants: (row.participants as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    actions,
  }
}

function toAction(row: Record<string, unknown>): MeetingAction {
  return {
    id: row.id as string,
    minutesId: row.minutes_id as string,
    description: row.description as string,
    assigneeId: (row.assignee_id as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    done: (row.done as boolean) ?? false,
    createdAt: row.created_at as string,
  }
}

export const MeetingMinutesService = {
  async create(
    data: {
      eventId: string
      organizationId: string
      createdBy: string
      title: string
      objective?: string
      summary?: string
      decisions?: string
      notes?: string
      participants: string[]
      conversationId?: string
    },
    actions: Array<{ description: string; assigneeId?: string; dueDate?: string }> = [],
  ): Promise<{ minutes: MeetingMinutes | null; error: string | null }> {
    const { data: row, error } = await supabase
      .from('meeting_minutes')
      .insert({
        event_id: data.eventId,
        organization_id: data.organizationId,
        created_by: data.createdBy,
        title: data.title,
        objective: data.objective || null,
        summary: data.summary || null,
        decisions: data.decisions || null,
        notes: data.notes || null,
        participants: data.participants,
        conversation_id: data.conversationId || null,
      })
      .select()
      .single()

    if (error || !row) return { minutes: null, error: friendlyError(error?.message) ?? i18n.t('errors.minutesCreationError') }

    const minutesId = (row as Record<string, unknown>).id as string
    let savedActions: MeetingAction[] = []

    if (actions.length > 0) {
      const actionRows = actions
        .filter(a => a.description.trim())
        .map(a => ({
          minutes_id: minutesId,
          description: a.description,
          assignee_id: a.assigneeId || null,
          due_date: a.dueDate || null,
        }))

      if (actionRows.length > 0) {
        const { data: aRows } = await supabase
          .from('meeting_actions')
          .insert(actionRows)
          .select()

        savedActions = (aRows ?? []).map(r => toAction(r as Record<string, unknown>))

        // Mirror each action as a task (source: 'meeting') so it appears in the Tasks module
        const taskRows = savedActions.map(a => ({
          org_id: data.organizationId,
          title: a.description,
          assignee_id: a.assigneeId ?? null,
          due_date: a.dueDate ?? null,
          created_by: data.createdBy,
          status: 'todo' as const,
          source: 'meeting' as const,
          source_id: a.id,
        }))
        await supabase.from('tasks').insert(taskRows)
      }
    }

    return { minutes: toMinutes(row as Record<string, unknown>, savedActions), error: null }
  },

  async getByEvent(eventId: string): Promise<MeetingMinutes | null> {
    const { data: row } = await supabase
      .from('meeting_minutes')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle()

    if (!row) return null

    const minutesId = (row as Record<string, unknown>).id as string
    const { data: aRows } = await supabase
      .from('meeting_actions')
      .select('*')
      .eq('minutes_id', minutesId)
      .order('created_at')

    const actions = (aRows ?? []).map(r => toAction(r as Record<string, unknown>))
    return toMinutes(row as Record<string, unknown>, actions)
  },

  async createStandaloneAction(data: {
    organizationId: string
    createdBy: string
    description: string
    dueDate: string | null
  }): Promise<void> {
    const { error } = await supabase.from('assistant_actions').insert({
      organization_id: data.organizationId,
      created_by: data.createdBy,
      description: data.description,
      due_date: data.dueDate ?? null,
    })
    if (error) throw new Error(friendlyError(error.message) ?? error.message)
  },

  async toggleAction(actionId: string, done: boolean): Promise<void> {
    await supabase.from('meeting_actions').update({ done }).eq('id', actionId)
  },

  async update(
    minutesId: string,
    data: Partial<{
      title: string
      objective: string
      summary: string
      decisions: string
      notes: string
    }>,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('meeting_minutes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', minutesId)
    return { error: serviceError(error) }
  },
}
