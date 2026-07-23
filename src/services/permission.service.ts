import type { TeamPermission } from '../lib/types'

// Phase 1: permissions stored in memory per team (keyed by teamId).
// Phase 3: supabase.from('team_permissions').select('*').eq('team_id', teamId)
const TEAM_PERMS_STORE: Record<string, Record<string, boolean>> = {
  t1: { invite_members: true,  manage_documents: true,  manage_events: true,  admin_space: true  },
  t2: { invite_members: false, manage_documents: true,  manage_events: true,  admin_space: false },
  t3: { invite_members: true,  manage_documents: true,  manage_events: false, admin_space: false },
  t4: { invite_members: false, manage_documents: false, manage_events: true,  admin_space: false },
  t5: { invite_members: true,  manage_documents: true,  manage_events: true,  admin_space: false },
}

const DEFAULT_PERMS: Record<string, boolean> = {
  invite_members: false,
  manage_documents: false,
  manage_events: false,
  admin_space: false,
}

export const PermissionService = {
  /** Retrieve all permission toggles for a team. */
  getTeamPerms(teamId: string): Record<string, boolean> {
    // TODO Phase 3: supabase.from('team_permissions').select('*').eq('team_id', teamId)
    return TEAM_PERMS_STORE[teamId] ?? { ...DEFAULT_PERMS }
  },

  /** Persist updated permissions for a team. */
  updateTeamPerms(teamId: string, perms: Record<string, boolean>): void {
    // TODO Phase 3: supabase.from('team_permissions').upsert(entries)
    TEAM_PERMS_STORE[teamId] = { ...perms }
  },

  /** Check a single permission for a user in a team. */
  check(userId: string, teamId: string, permission: string): boolean {
    // TODO Phase 3: also verify server-side via RLS / edge function
    void userId
    return PermissionService.getTeamPerms(teamId)[permission] ?? false
  },

  /** Convert the flat Record to an array of TeamPermission rows. */
  toRows(teamId: string): TeamPermission[] {
    return Object.entries(PermissionService.getTeamPerms(teamId)).map(([k, v]) => ({
      teamId,
      permissionName: k,
      enabled: v,
    }))
  },
}
