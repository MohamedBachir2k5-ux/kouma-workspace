import type { TeamPermission } from '../lib/types'
import { TeamService } from './team.service'
import { supabase } from '../lib/supabase'

export const PermissionService = {
  async getTeamPerms(teamId: string): Promise<Record<string, boolean>> {
    const rows = await TeamService.getPermissions(teamId)
    return Object.fromEntries(rows.map(r => [r.permission_name, r.enabled]))
  },

  async updateTeamPerms(teamId: string, perms: Record<string, boolean>): Promise<{ error: string | null }> {
    const results = await Promise.all(
      Object.entries(perms).map(([name, enabled]) =>
        TeamService.setPermission(teamId, name, enabled)
      )
    )
    const err = results.find(r => r.error)
    return { error: err?.error ?? null }
  },

  async toRows(teamId: string): Promise<TeamPermission[]> {
    const perms = await PermissionService.getTeamPerms(teamId)
    return Object.entries(perms).map(([k, v]) => ({
      teamId,
      permissionName: k,
      enabled: v,
    }))
  },

  async getMemberPerms(teamId: string, memberId: string): Promise<Record<string, boolean>> {
    const { data } = await supabase
      .from('team_member_permissions')
      .select('permission_key, granted')
      .eq('team_id', teamId)
      .eq('member_id', memberId)
    return Object.fromEntries((data ?? []).map(r => [r.permission_key, r.granted]))
  },

  async updateMemberPerms(teamId: string, memberId: string, perms: Record<string, boolean>): Promise<{ error: string | null }> {
    const rows = Object.entries(perms).map(([permission_key, granted]) => ({
      team_id: teamId,
      member_id: memberId,
      permission_key,
      granted,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from('team_member_permissions')
      .upsert(rows, { onConflict: 'team_id,member_id,permission_key' })
    return { error: error?.message ?? null }
  },
}
