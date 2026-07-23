import { supabase } from '../lib/supabase'
import type { TeamRow, TeamMemberRow, TeamPermissionRow } from '../lib/database.types'

export interface CreateTeamParams {
  organizationId: string
  name: string
  description?: string
  color: string
  ownerId: string
  actorId: string
}

export const TeamService = {
  async create(params: CreateTeamParams): Promise<{ teamId: string | null; error: string | null }> {
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        organization_id: params.organizationId,
        name: params.name,
        description: params.description ?? null,
        color: params.color,
        owner_id: params.ownerId,
      })
      .select()
      .single()

    if (error) return { teamId: null, error: error.message }

    // Add owner as first member with owner role
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: params.ownerId,
      role: 'owner',
    })

    // Seed default permissions
    const defaults = ['send_messages', 'upload_files', 'view_members']
    await supabase.from('team_permissions').insert(
      defaults.map(p => ({ team_id: team.id, permission_name: p, enabled: true }))
    )

    await supabase.from('audit_logs').insert({
      organization_id: params.organizationId,
      user_id: params.actorId,
      action: 'team_created',
      target_id: team.id,
      target_name: params.name,
    })

    return { teamId: team.id, error: null }
  },

  async getByOrganization(organizationId: string): Promise<TeamRow[]> {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('organization_id', organizationId)
    return data ?? []
  },

  async getForUser(userId: string, organizationId: string): Promise<TeamRow[]> {
    const { data } = await supabase
      .from('team_members')
      .select('teams(*)')
      .eq('user_id', userId)

    if (!data) return []
    const teams = data.map(r => (r as unknown as { teams: TeamRow }).teams).filter(Boolean)
    return teams.filter(t => t.organization_id === organizationId)
  },

  async update(teamId: string, updates: Partial<Pick<TeamRow, 'name' | 'description' | 'color' | 'owner_id'>>, organizationId: string, actorId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('teams').update(updates).eq('id', teamId)
    if (!error) {
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: actorId,
        action: 'team_updated',
        target_id: teamId,
      })
    }
    return { error: error?.message ?? null }
  },

  async delete(teamId: string, organizationId: string, actorId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (!error) {
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: actorId,
        action: 'team_deleted',
        target_id: teamId,
      })
    }
    return { error: error?.message ?? null }
  },

  async getMembers(teamId: string): Promise<TeamMemberRow[]> {
    const { data } = await supabase.from('team_members').select('*').eq('team_id', teamId)
    return data ?? []
  },

  async addMember(teamId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<{ error: string | null }> {
    const { error } = await supabase.from('team_members').upsert({ team_id: teamId, user_id: userId, role })
    return { error: error?.message ?? null }
  },

  async removeMember(teamId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId)
    return { error: error?.message ?? null }
  },

  async getPermissions(teamId: string): Promise<TeamPermissionRow[]> {
    const { data } = await supabase.from('team_permissions').select('*').eq('team_id', teamId)
    return data ?? []
  },

  async setPermission(teamId: string, permissionName: string, enabled: boolean): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('team_permissions')
      .upsert({ team_id: teamId, permission_name: permissionName, enabled })
    return { error: error?.message ?? null }
  },
}
