import { supabase } from '../lib/supabase'
import type { AuditLog, AuditAction } from '../lib/types'
import type { Tables } from '../lib/database.types'

type AuditLogRow = Tables<'audit_logs'>

function rowToLog(r: AuditLogRow): AuditLog {
  return {
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    action: r.action as AuditAction,
    targetType: r.target_type,
    targetId: r.target_id,
    targetName: r.target_name,
    detail: r.detail,
    createdAt: r.created_at,
  }
}

export const AuditService = {
  async getLogs(orgId: string): Promise<AuditLog[]> {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    return (data ?? []).map(rowToLog)
  },

  async getRecent(orgId: string, limit = 5, actions?: string[]): Promise<AuditLog[]> {
    let q = supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (actions?.length) q = q.in('action', actions)
    const { data } = await q
    return (data ?? []).map(rowToLog)
  },

  async log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    await supabase.from('audit_logs').insert({
      organization_id: entry.organizationId,
      user_id: entry.userId,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      target_name: entry.targetName ?? null,
      detail: entry.detail ?? null,
    })
  },

  describe(log: AuditLog): string {
    const name = log.targetName ?? ''
    const descriptions: Partial<Record<AuditAction, string>> = {
      organization_created: "a créé l'organisation",
      user_joined:          'a rejoint le workspace',
      user_suspended:       'a été suspendu',
      user_revoked:         'a été révoqué',
      user_activated:       'a été réactivé',
      invite_generated:     "a généré un lien d'invitation",
      team_created:         `a créé l'équipe ${name}`,
      team_updated:         `a modifié l'équipe ${name}`,
      team_deleted:         `a supprimé l'équipe ${name}`,
      document_added:       `a importé ${name}`,
      document_deleted:     `a supprimé ${name}`,
      subscription_changed: "a modifié l'abonnement",
      permission_changed:   `a modifié les permissions de ${name}`,
    }
    return descriptions[log.action] ?? log.action
  },
}
