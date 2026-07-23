import type { Document } from '../lib/types'
import { mockDocuments } from '../lib/mock'

export const DocumentService = {
  /** List all documents in an organisation. */
  list(orgId: string): Document[] {
    // TODO Phase 3: supabase.from('documents').select('*').eq('organization_id', orgId)
    return mockDocuments.filter(d => d.organizationId === orgId)
  },

  /** Documents belonging to a specific team. */
  getByTeam(teamId: string): Document[] {
    // TODO Phase 3: supabase.from('documents').select('*').eq('team_id', teamId)
    return mockDocuments.filter(d => d.teamId === teamId)
  },

  /** Total storage used by an organisation in bytes. */
  totalUsed(orgId: string): number {
    return DocumentService.list(orgId).reduce((sum, d) => sum + d.size, 0)
  },
}
