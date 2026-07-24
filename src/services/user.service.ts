import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../lib/database.types'
import type { User } from '../lib/types'

export const UserService = {
  async getById(id: string): Promise<ProfileRow | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    return data ?? null
  },

  async getByOrganization(organizationId: string): Promise<ProfileRow[]> {
    const { data } = await supabase
      .from('organization_members')
      .select('profiles(*)')
      .eq('organization_id', organizationId)
      .neq('status', 'deleted')

    if (!data) return []
    return data.map(row => (row as unknown as { profiles: ProfileRow }).profiles).filter(Boolean)
  },

  async updateProfile(userId: string, updates: Partial<Pick<ProfileRow, 'firstname' | 'lastname' | 'phone' | 'avatar_url' | 'country' | 'language'>>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    return { error: error?.message ?? null }
  },

  async updateStatus(
    userId: string,
    organizationId: string,
    status: 'active' | 'suspended' | 'deleted',
    actorId: string,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('organization_members')
      .update({ status })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (!error) {
      const actionMap = { active: 'user_activated', suspended: 'user_suspended', deleted: 'user_revoked' }
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: actorId,
        action: actionMap[status],
        target_id: userId,
        target_type: 'user',
      })
    }

    return { error: error?.message ?? null }
  },

  async invite(organizationId: string, actorId: string): Promise<{ token: string | null; error: string | null }> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        status: 'sent',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) return { token: null, error: error.message }

    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: actorId,
      action: 'invite_generated',
    })

    return { token: data.token, error: null }
  },

  async acceptInvite(
    token: string,
    userId: string,
    meta?: { departmentId?: string; jobTitle?: string },
  ): Promise<{ error: string | null }> {
    const { data: invite, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'sent')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (fetchError || !invite) return { error: 'Lien d\'invitation invalide ou expiré.' }

    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: invite.organization_id,
      user_id: userId,
      role: 'member',
      status: 'active',
      department_id: meta?.departmentId ?? null,
      job_title: meta?.jobTitle ?? null,
    })

    if (memberError) return { error: memberError.message }

    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    return { error: null }
  },

  async getByOrganizationWithRole(organizationId: string): Promise<User[]> {
    const { data } = await supabase
      .from('organization_members')
      .select('role, status, department_id, job_title, departments(name), profiles(*)')
      .eq('organization_id', organizationId)
      .neq('status', 'deleted')

    if (!data) return []

    const result: User[] = []
    for (const row of data) {
      type MemberRow = {
        role: string
        status: string
        department_id: string | null
        job_title: string | null
        departments: { name: string } | null
        profiles: ProfileRow
      }
      const m = row as unknown as MemberRow
      const p = m.profiles
      if (!p) continue
      result.push({
        id: p.id,
        organizationId,
        firstName: p.firstname,
        lastName: p.lastname,
        email: p.email,
        phone: p.phone ?? undefined,
        avatarUrl: p.avatar_url ?? undefined,
        country: p.country ?? undefined,
        language: p.language,
        role: m.role,
        status: m.status as User['status'],
        department: m.departments?.name ?? undefined,
        jobTitle: m.job_title ?? undefined,
        createdAt: p.created_at,
      })
    }
    return result
  },

  async getInviteByToken(token: string): Promise<{ organizationId: string } | null> {
    const { data } = await supabase
      .from('invitations')
      .select('organization_id')
      .eq('token', token)
      .eq('status', 'sent')
      .gt('expires_at', new Date().toISOString())
      .single()
    return data ? { organizationId: data.organization_id } : null
  },

  async getAdminCount(organizationId: string): Promise<number> {
    const { count } = await supabase
      .from('organization_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('role', 'admin')
      .neq('status', 'deleted')
    return count ?? 0
  },

  async promoteToAdmin(
    organizationId: string,
    targetUserId: string,
    actorId: string,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: 'admin' })
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)

    if (error) return { error: error.message }

    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: actorId,
      action: 'admin_promoted',
      target_id: targetUserId,
      target_type: 'user',
    })

    return { error: null }
  },

  async demoteAdmin(
    organizationId: string,
    targetUserId: string,
    actorId: string,
  ): Promise<{ error: string | null }> {
    // Guard: at least 1 admin must remain
    const adminCount = await this.getAdminCount(organizationId)
    if (adminCount <= 1) {
      return { error: 'Impossible de retirer le dernier administrateur. Promouvez d\'abord un autre collaborateur.' }
    }

    // 1. Demote role
    const { error: roleError } = await supabase
      .from('organization_members')
      .update({ role: 'member' })
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)

    if (roleError) return { error: roleError.message }

    // 2. Remove access to org recovery keys (E2E escrow)
    await supabase
      .from('org_recovery_keys')
      .delete()
      .eq('organization_id', organizationId)
      .eq('admin_user_id', targetUserId)

    // 3. Revoke all sessions
    await supabase
      .from('user_sessions')
      .update({ revoked: true })
      .eq('user_id', targetUserId)

    // 4. Audit log
    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: actorId,
      action: 'admin_demoted',
      target_id: targetUserId,
      target_type: 'user',
    })

    return { error: null }
  },

  async uploadAvatar(userId: string, orgId: string, file: File): Promise<{ avatarUrl: string | null; error: string | null }> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    // Path must be org-scoped so storage RLS policy allows it
    const path = `${orgId}/avatars/${userId}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) return { avatarUrl: null, error: uploadErr.message }
    const { data } = supabase.storage.from('attachments').getPublicUrl(path)
    const avatarUrl = data.publicUrl
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
    return { avatarUrl, error: null }
  },

  async searchByOrganization(organizationId: string, query: string): Promise<ProfileRow[]> {
    const { data } = await supabase
      .from('organization_members')
      .select('profiles(*)')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (!data) return []
    const profiles = data.map(row => (row as unknown as { profiles: ProfileRow }).profiles).filter(Boolean)
    const q = query.toLowerCase()
    return profiles.filter(p =>
      `${p.firstname} ${p.lastname} ${p.email}`.toLowerCase().includes(q)
    )
  },
}
