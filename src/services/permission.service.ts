import type { TeamPermission } from '../lib/types'
import { TeamService } from './team.service'

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
}
