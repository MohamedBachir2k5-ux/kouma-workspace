import { supabase } from '../lib/supabase'
import { serviceError, friendlyError } from '../lib/errors'
import i18n from '../i18n'

export interface Announcement {
  id: string
  organizationId: string
  authorId: string
  title: string
  body: string
  pinned: boolean
  createdAt: string
  updatedAt?: string
  read?: boolean
}

type AnnouncementRow = {
  id: string
  organization_id: string
  author_id: string
  title: string
  body: string
  pinned: boolean
  created_at: string
  updated_at: string | null
}

function rowToAnnouncement(r: AnnouncementRow, readIds: Set<string>): Announcement {
  return {
    id: r.id,
    organizationId: r.organization_id,
    authorId: r.author_id,
    title: r.title,
    body: r.body,
    pinned: r.pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? undefined,
    read: readIds.has(r.id),
  }
}

export const AnnouncementService = {
  async list(orgId: string, userId: string): Promise<Announcement[]> {
    const [{ data: rows }, { data: reads }] = await Promise.all([
      supabase
        .from('announcements')
        .select('*')
        .eq('organization_id', orgId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', userId),
    ])
    const readIds = new Set((reads ?? []).map(r => r.announcement_id))
    return ((rows ?? []) as unknown as AnnouncementRow[]).map(r => rowToAnnouncement(r, readIds))
  },

  async create(
    orgId: string,
    authorId: string,
    title: string,
    body: string,
    pinned = false,
  ): Promise<{ announcement: Announcement | null; error: string | null }> {
    const { data, error } = await supabase
      .from('announcements')
      .insert({ organization_id: orgId, author_id: authorId, title, body, pinned })
      .select()
      .single()
    if (error || !data) return { announcement: null, error: friendlyError(error?.message) ?? i18n.t('errors.creationError') }

    // Notify all org members
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .neq('user_id', authorId)
      .eq('status', 'active')

    if (members?.length) {
      await supabase.rpc('notify_users', {
        p_user_ids: members.map(m => m.user_id),
        p_type: 'announcement',
        p_payload: { text: `Nouvelle annonce : « ${title} »`, announcementId: (data as unknown as AnnouncementRow).id },
      })
    }

    return {
      announcement: rowToAnnouncement(data as unknown as AnnouncementRow, new Set()),
      error: null,
    }
  },

  async update(id: string, updates: Partial<Pick<Announcement, 'title' | 'body' | 'pinned'>>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('announcements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    return { error: serviceError(error) }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    return { error: serviceError(error) }
  },

  async markRead(announcementId: string, userId: string): Promise<void> {
    await supabase
      .from('announcement_reads')
      .upsert({ announcement_id: announcementId, user_id: userId })
  },

  async unreadCount(orgId: string, userId: string): Promise<number> {
    const { data: total } = await supabase
      .from('announcements')
      .select('id', { count: 'exact', head: false })
      .eq('organization_id', orgId)

    const { data: reads } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', userId)

    const readIds = new Set((reads ?? []).map(r => r.announcement_id))
    return (total ?? []).filter(a => !readIds.has(a.id)).length
  },
}
