import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../lib/database.types'
import type { User } from '../lib/types'
import { serviceError, friendlyError } from '../lib/errors'
import i18n from '../i18n'

// Internal sentinel for "user is already a member" — swallowed by callers as a no-op success
export const ERR_ALREADY_MEMBER = 'ALREADY_MEMBER'

export const UserService = {
  async getById(id: string): Promise<ProfileRow | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
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
    return { error: serviceError(error) }
  },

  async updateStatus(
    userId: string,
    organizationId: string,
    status: 'active' | 'suspended' | 'deleted',
    actorId: string,
  ): Promise<{ error: string | null }> {
    // Fetch name before update for audit log
    const { data: profile } = await supabase
      .from('profiles')
      .select('firstname, lastname, email')
      .eq('id', userId)
      .single()
    const targetName = profile
      ? ((`${profile.firstname ?? ''} ${profile.lastname ?? ''}`).trim() || profile.email)
      : ''

    const updates: { status: string; deleted_at?: string | null } = { status }
    if (status === 'deleted') updates.deleted_at = new Date().toISOString()
    if (status === 'active') updates.deleted_at = null

    const { error } = await supabase
      .from('organization_members')
      .update(updates)
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
        target_name: targetName,
      })

      // Revoke all sessions immediately on suspend or delete
      if (status === 'suspended' || status === 'deleted') {
        await supabase
          .from('user_sessions')
          .update({ revoked: true })
          .eq('user_id', userId)
      }
    }

    return { error: serviceError(error) }
  },

  async invite(organizationId: string, actorId: string, expiryDays?: number | null): Promise<{ token: string | null; error: string | null }> {
    // Reuse any valid unexpired invitation (avoids multiple active tokens)
    const { data: existing } = await supabase
      .from('invitations')
      .select('token, expires_at')
      .eq('organization_id', organizationId)
      .eq('status', 'sent')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) return { token: existing.token, error: null }

    const expiresAt = new Date()
    // null means "never expire" — use 10 years; undefined falls back to 7 days default
    const daysToAdd = expiryDays === null ? 3650 : (expiryDays ?? 7)
    expiresAt.setDate(expiresAt.getDate() + daysToAdd)

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        status: 'sent',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) return { token: null, error: friendlyError(error.message) }

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
    type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
    const { data, error } = await (supabase.rpc as unknown as RpcFn)('accept_member_invite', {
      p_token: token,
      p_user_id: userId,
      p_department_id: meta?.departmentId ?? null,
      p_job_title: meta?.jobTitle ?? null,
    })
    if (error) return { error: friendlyError(error.message) }
    const result = data as { error: string | null } | null
    const rpcError = result?.error ?? null
    if (rpcError) {
      if (/déjà membre/i.test(rpcError)) return { error: ERR_ALREADY_MEMBER }
      if (/invitation invalide|expiré/i.test(rpcError)) return { error: i18n.t('joinOrg.expiredLink') }
      if (/non autorisée/i.test(rpcError)) return { error: i18n.t('errors.accessDenied') }
      return { error: rpcError }
    }
    return { error: null }
  },

  async getByOrganizationWithRole(organizationId: string): Promise<User[]> {
    const { data } = await supabase
      .from('organization_members')
      .select('role, status, deleted_at, department_id, job_title, departments(name), profiles(*)')
      .eq('organization_id', organizationId)

    if (!data) return []

    const result: User[] = []
    for (const row of data) {
      type MemberRow = {
        role: string
        status: string
        deleted_at: string | null
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
        firstName: p.firstname ?? '',
        lastName: p.lastname ?? '',
        email: p.email,
        phone: p.phone ?? undefined,
        avatarUrl: p.avatar_url ?? undefined,
        country: p.country ?? undefined,
        language: p.language,
        role: m.role,
        status: m.status as User['status'],
        deletedAt: m.deleted_at ?? null,
        department: m.departments?.name ?? undefined,
        jobTitle: m.job_title ?? undefined,
        createdAt: p.created_at,
      })
    }
    return result
  },

  async getMemberInfo(userId: string, orgId: string): Promise<{ role: string; status: string; jobTitle?: string; department?: string } | null> {
    const { data } = await supabase
      .from('organization_members')
      .select('role, status, job_title, departments(name)')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .maybeSingle()
    if (!data) return null
    const d = data as unknown as { role: string; status: string; job_title: string | null; departments: { name: string } | null }
    return {
      role: d.role,
      status: d.status,
      jobTitle: d.job_title ?? undefined,
      department: d.departments?.name ?? undefined,
    }
  },

  async getInviteByToken(token: string): Promise<{ organizationId: string } | null> {
    type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
    const { data, error } = await (supabase.rpc as unknown as RpcFn)('get_org_for_invite', { p_token: token })
    if (error || !data) return null
    return { organizationId: data as string }
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('firstname, lastname, email')
      .eq('id', targetUserId)
      .single()
    const targetName = profile
      ? ((`${profile.firstname ?? ''} ${profile.lastname ?? ''}`).trim() || profile.email)
      : ''

    const { error } = await supabase
      .from('organization_members')
      .update({ role: 'admin' })
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)

    if (error) return { error: friendlyError(error.message) }

    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: actorId,
      action: 'admin_promoted',
      target_id: targetUserId,
      target_type: 'user',
      target_name: targetName,
    })

    await supabase.rpc('notify_users', {
      p_user_ids: [targetUserId],
      p_type: 'role_changed',
      p_payload: { text: i18n.t('notifications.promotedToAdmin') },
    })

    return { error: null }
  },

  async demoteAdmin(
    organizationId: string,
    targetUserId: string,
    actorId: string,
  ): Promise<{ error: string | null }> {
    const adminCount = await this.getAdminCount(organizationId)
    if (adminCount <= 1) {
      return { error: i18n.t('errors.lastAdminCannotBeRevoked') }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('firstname, lastname, email')
      .eq('id', targetUserId)
      .single()
    const targetName = profile
      ? ((`${profile.firstname ?? ''} ${profile.lastname ?? ''}`).trim() || profile.email)
      : ''

    const { error: roleError } = await supabase
      .from('organization_members')
      .update({ role: 'member' })
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)

    if (roleError) return { error: roleError.message }

    await supabase
      .from('org_recovery_keys')
      .delete()
      .eq('organization_id', organizationId)
      .eq('admin_user_id', targetUserId)

    await supabase
      .from('user_sessions')
      .update({ revoked: true })
      .eq('user_id', targetUserId)

    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: actorId,
      action: 'admin_demoted',
      target_id: targetUserId,
      target_type: 'user',
      target_name: targetName,
    })

    await supabase.rpc('notify_users', {
      p_user_ids: [targetUserId],
      p_type: 'role_changed',
      p_payload: { text: i18n.t('notifications.adminRightsRevoked') },
    })

    return { error: null }
  },

  async uploadAvatar(userId: string, orgId: string, file: File): Promise<{ avatarUrl: string | null; error: string | null }> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    // Path must be org-scoped so storage RLS policy allows it
    const path = `${orgId}/avatars/${userId}.${ext}`
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { avatarUrl: null, error: i18n.t('errors.avatarFormatNotAllowed') }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { avatarUrl: null, error: i18n.t('errors.avatarTooLarge') }
    }
    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) return { avatarUrl: null, error: uploadErr.message }
    // Bucket is private — signed URL with long expiry stored as avatar_url
    const { data: signed, error: signErr } = await supabase.storage
      .from('attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 365)
    if (signErr || !signed) return { avatarUrl: null, error: signErr?.message ?? i18n.t('errors.avatarUrlNotFound') }
    const avatarUrl = signed.signedUrl
    const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
    if (dbErr) return { avatarUrl: null, error: dbErr.message }
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
      `${p.firstname ?? ''} ${p.lastname ?? ''} ${p.email}`.toLowerCase().includes(q)
    )
  },

  async selfDeleteAccount(orgId: string): Promise<{ error: string | null }> {
    const { error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>)(
      'self_delete_account', { p_org_id: orgId }
    )
    return { error: serviceError(error as Parameters<typeof serviceError>[0]) }
  },
}
