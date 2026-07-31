import { supabase } from '../lib/supabase'
import { serviceError, friendlyError } from '../lib/errors'
import type { TeamRow, TeamMemberRow, TeamPermissionRow } from '../lib/database.types'
import type { Team } from '../lib/types'

export interface CreateTeamParams {
  organizationId: string
  name: string
  description?: string
  color: string
  ownerId: string
  actorId: string
}

export const TeamService = {
  async getTeamConversationId(teamId: string): Promise<string | null> {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('type', 'team')
      .eq('reference_id', teamId)
      .single()
    return data?.id ?? null
  },

  async ensureTeamConversation(teamId: string, orgId: string, memberIds: string[]): Promise<void> {
    await supabase.rpc('ensure_team_conversation', {
      p_org_id: orgId,
      p_team_id: teamId,
      p_members: memberIds,
    })
  },

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

    if (error) return { teamId: null, error: friendlyError(error.message) }

    // Add owner as first member with owner role
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: params.ownerId,
      role: 'owner',
    })
    // Create team conversation via RPC (bypasses RLS for conversation + members)
    await supabase.rpc('ensure_team_conversation', {
      p_org_id: params.organizationId,
      p_team_id: team.id,
      p_members: [params.ownerId],
    })

    // Seed the 4 UI-visible permission keys (all enabled by default, except admin_space)
    await supabase.from('team_permissions').insert([
      { team_id: team.id, permission_name: 'invite_members',   enabled: true },
      { team_id: team.id, permission_name: 'manage_documents', enabled: true },
      { team_id: team.id, permission_name: 'manage_events',    enabled: true },
      { team_id: team.id, permission_name: 'admin_space',      enabled: false },
    ])

    // Create a dedicated folder for this team's documents (org-visible so all members can see it)
    await supabase.from('folders').insert({
      organization_id: params.organizationId,
      team_id: team.id,
      name: params.name,
      parent_id: null,
      visibility: 'org',
      created_by: params.actorId,
    })

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

  async getByOrganizationWithMembers(organizationId: string): Promise<Team[]> {
    const { data: teams } = await supabase
      .from('teams')
      .select('*, team_members(user_id)')
      .eq('organization_id', organizationId)
      .order('name')

    if (!teams) return []

    return teams.map(t => {
      const members = (t as unknown as { team_members: { user_id: string }[] }).team_members ?? []
      return {
        id: t.id,
        organizationId: t.organization_id,
        name: t.name,
        description: t.description ?? undefined,
        responsableId: t.owner_id ?? '',
        members: members.map(m => m.user_id),
        color: t.color,
        createdAt: t.created_at,
      } satisfies Team
    })
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
    // Fetch name before update in case it changed (ensures audit log is always populated)
    const { data: existing } = await supabase.from('teams').select('name').eq('id', teamId).single()
    const { error } = await supabase.from('teams').update(updates).eq('id', teamId)
    if (!error) {
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: actorId,
        action: 'team_updated',
        target_id: teamId,
        target_name: updates.name ?? existing?.name ?? '',
      })
    }
    return { error: serviceError(error) }
  },

  async delete(teamId: string, organizationId: string, actorId: string): Promise<{ error: string | null }> {
    // Fetch name before delete — after deletion the row is gone
    const { data: existing } = await supabase.from('teams').select('name').eq('id', teamId).single()
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (!error) {
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: actorId,
        action: 'team_deleted',
        target_id: teamId,
        target_name: existing?.name ?? '',
      })
    }
    return { error: serviceError(error) }
  },

  async getMembers(teamId: string): Promise<TeamMemberRow[]> {
    const { data } = await supabase.from('team_members').select('*').eq('team_id', teamId)
    return data ?? []
  },

  async addMember(teamId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<{ error: string | null }> {
    const { error } = await supabase.from('team_members').upsert({ team_id: teamId, user_id: userId, role })
    if (!error) {
      const convId = await this.getTeamConversationId(teamId)
      if (convId) {
        await supabase.from('conversation_members').upsert({ conversation_id: convId, user_id: userId })
      }
      // Notify the added member
      const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
      if (team) {
        await supabase.rpc('notify_users', {
          p_user_ids: [userId],
          p_type: 'team_member_added',
          p_payload: { text: `Vous avez été ajouté à l'équipe "${team.name}".`, teamId },
        })
      }
    }
    return { error: serviceError(error) }
  },

  async removeMember(teamId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId)
    if (!error) {
      const convId = await this.getTeamConversationId(teamId)
      if (convId) {
        await supabase.from('conversation_members').delete().eq('conversation_id', convId).eq('user_id', userId)
      }
    }
    return { error: serviceError(error) }
  },

  async getPermissions(teamId: string): Promise<TeamPermissionRow[]> {
    const { data } = await supabase.from('team_permissions').select('*').eq('team_id', teamId)
    return data ?? []
  },

  async setPermission(teamId: string, permissionName: string, enabled: boolean): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('team_permissions')
      .upsert({ team_id: teamId, permission_name: permissionName, enabled })
    return { error: serviceError(error) }
  },
}
