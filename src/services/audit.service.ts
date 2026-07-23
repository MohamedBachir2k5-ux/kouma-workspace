import type { AuditLog, AuditAction } from '../lib/types'
import { mockAuditLogs } from '../lib/mock'

export const AuditService = {
  /** All audit logs for an organisation, newest first. */
  getLogs(orgId: string): AuditLog[] {
    // TODO Phase 3: supabase.from('audit_logs').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    return [...mockAuditLogs]
      .filter(l => l.organizationId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  /** Most recent N logs — used for dashboard widgets. */
  getRecent(orgId: string, limit = 5): AuditLog[] {
    return AuditService.getLogs(orgId).slice(0, limit)
  },

  /** Write a new audit entry. */
  log(entry: Omit<AuditLog, 'id' | 'createdAt'>): void {
    // TODO Phase 3: supabase.from('audit_logs').insert(entry)
    mockAuditLogs.unshift({
      ...entry,
      id: `l${Date.now()}`,
      createdAt: new Date().toISOString(),
    })
  },

  /** Human-readable description of an action. */
  describe(log: AuditLog): string {
    const name = log.targetName ?? ''
    const descriptions: Partial<Record<AuditAction, string>> = {
      organization_created: 'a créé l\'organisation',
      user_joined:          'a rejoint le workspace',
      user_suspended:       'a été suspendu',
      user_revoked:         'a été révoqué',
      user_activated:       'a été réactivé',
      invite_generated:     'a généré un lien d\'invitation',
      team_created:         `a créé l'équipe ${name}`,
      team_updated:         `a modifié l'équipe ${name}`,
      team_deleted:         `a supprimé l'équipe ${name}`,
      document_added:       `a importé ${name}`,
      document_deleted:     `a supprimé ${name}`,
      subscription_changed: 'a modifié l\'abonnement',
      permission_changed:   `a modifié les permissions de ${name}`,
    }
    return descriptions[log.action] ?? log.action
  },
}
