import { supabase } from '../lib/supabase'
import type { AuditLog, AuditAction } from '../lib/types'
import type { Tables } from '../lib/database.types'
import i18n from '../i18n'

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
    const t = i18n.t.bind(i18n)
    const descriptions: Partial<Record<AuditAction, string>> = {
      organization_created: t('audit.organizationCreated'),
      user_joined:          t('audit.userJoined'),
      user_suspended:       t('audit.userSuspended'),
      user_revoked:         t('audit.userRevoked'),
      user_activated:       t('audit.userActivated'),
      invite_generated:     t('audit.inviteGenerated'),
      team_created:         t('audit.teamCreated', { name }),
      team_updated:         t('audit.teamUpdated', { name }),
      team_deleted:         t('audit.teamDeleted', { name }),
      document_added:       t('audit.documentAdded', { name }),
      document_deleted:     t('audit.documentDeleted', { name }),
      subscription_changed: t('audit.subscriptionChanged'),
      permission_changed:   t('audit.permissionChanged', { name }),
    }
    return descriptions[log.action] ?? log.action
  },
}
