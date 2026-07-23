import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../lib/database.types'

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

  async invite(email: string, organizationId: string, actorId: string): Promise<{ token: string | null; error: string | null }> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email,
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
      detail: email,
    })

    return { token: data.token, error: null }
  },

  async acceptInvite(token: string, userId: string): Promise<{ error: string | null }> {
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
    })

    if (memberError) return { error: memberError.message }

    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    return { error: null }
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
