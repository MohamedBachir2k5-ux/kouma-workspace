import { supabase } from '../lib/supabase'
import type { Task } from '../lib/types'

type TaskPayload = {
  title: string
  assigneeId?: string | null
  dueDate?: string | null
  status?: Task['status']
}

export class TaskService {
  static async list(orgId: string): Promise<{ tasks: Task[]; error: string | null }> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id, org_id, title, assignee_id, created_by, status, due_date, source, source_id, created_at, updated_at,
        assignee:profiles!tasks_assignee_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) return { tasks: [], error: error.message }

    const tasks = (data ?? []).map((r: Record<string, unknown>) => {
      const a = r.assignee as { id: string; first_name: string; last_name: string; avatar_url: string | null } | null
      return {
        id: r.id as string,
        orgId: r.org_id as string,
        title: r.title as string,
        assigneeId: r.assignee_id as string | null,
        assignee: a ? { id: a.id, firstName: a.first_name, lastName: a.last_name, avatarUrl: a.avatar_url } : null,
        createdBy: r.created_by as string,
        status: r.status as Task['status'],
        dueDate: r.due_date as string | null,
        source: r.source as Task['source'],
        sourceId: r.source_id as string | null,
        createdAt: r.created_at as string,
        updatedAt: r.updated_at as string,
      } satisfies Task
    })

    return { tasks, error: null }
  }

  static async create(orgId: string, payload: TaskPayload): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { error } = await supabase.from('tasks').insert({
      org_id: orgId,
      title: payload.title.trim(),
      assignee_id: payload.assigneeId ?? null,
      due_date: payload.dueDate ?? null,
      status: payload.status ?? 'todo',
      created_by: user.id,
    })
    return { error: error?.message ?? null }
  }

  static async update(id: string, payload: Partial<TaskPayload>): Promise<{ error: string | null }> {
    type Patch = {
      updated_at: string
      title?: string
      assignee_id?: string | null
      due_date?: string | null
      status?: Task['status']
    }
    const patch: Patch = { updated_at: new Date().toISOString() }
    if (payload.title !== undefined)      patch.title       = payload.title.trim()
    if (payload.assigneeId !== undefined) patch.assignee_id = payload.assigneeId
    if (payload.dueDate !== undefined)    patch.due_date    = payload.dueDate
    if (payload.status !== undefined)     patch.status      = payload.status

    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    return { error: error?.message ?? null }
  }

  static async remove(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    return { error: error?.message ?? null }
  }
}
