import { useState, useEffect } from 'react'
import { UserCheck, UserX, Users, ShieldCheck, Link as LinkIcon, Pencil, Search, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { AuditService } from '../../services/audit.service'
import { UserService } from '../../services/user.service'
import { useAuth } from '../../contexts/AuthContext'
import type { AuditLog, AuditAction, User } from '../../lib/types'

const PAGE_SIZE = 5

type ActionConfigEntry = { icon: typeof UserCheck; labelKey: string; color: string }

const ORG_AUDIT_ACTIONS = new Set<AuditAction>([
  'organization_created', 'user_joined', 'user_suspended', 'user_revoked', 'user_activated',
  'invite_generated', 'team_created', 'team_updated', 'team_deleted', 'permission_changed',
  'admin_promoted', 'admin_demoted', 'subscription_changed',
  'recovery_initiated', 'recovery_completed', 'breakglass_used',
])

const ACTION_CONFIG: Partial<Record<AuditAction, ActionConfigEntry>> = {
  user_joined:          { icon: UserCheck,   labelKey: 'admin.logUserJoined',    color: 'bg-success/10 text-success' },
  user_suspended:       { icon: UserX,       labelKey: 'admin.logUserSuspended', color: 'bg-amber/10 text-amber' },
  user_revoked:         { icon: UserX,       labelKey: 'admin.logUserRevoked',   color: 'bg-danger/10 text-danger' },
  user_activated:       { icon: UserCheck,   labelKey: 'admin.logUserActivated', color: 'bg-success/10 text-success' },
  team_created:         { icon: Users,       labelKey: 'admin.logTeamCreated',   color: 'bg-indigo/10 text-indigo' },
  team_updated:         { icon: Pencil,      labelKey: 'admin.logTeamUpdated',   color: 'bg-indigo/10 text-indigo' },
  team_deleted:         { icon: Users,       labelKey: 'admin.logTeamDeleted',   color: 'bg-danger/10 text-danger' },
  permission_changed:   { icon: ShieldCheck, labelKey: 'admin.logPermChanged',   color: 'bg-navy/10 text-navy' },
  invite_generated:     { icon: LinkIcon,    labelKey: 'admin.logInviteGen',     color: 'bg-muted/10 text-muted' },
  subscription_changed: { icon: ShieldCheck, labelKey: 'admin.logSubChanged',    color: 'bg-navy/10 text-navy' },
  organization_created: { icon: UserCheck,   labelKey: 'admin.logOrgCreated',    color: 'bg-success/10 text-success' },
  admin_promoted:       { icon: Shield,      labelKey: 'admin.logAdminPromoted', color: 'bg-indigo/10 text-indigo' },
  admin_demoted:        { icon: Shield,      labelKey: 'admin.logAdminDemoted',  color: 'bg-amber/10 text-amber' },
  recovery_initiated:   { icon: ShieldCheck, labelKey: 'admin.logRecovery',      color: 'bg-amber/10 text-amber' },
  recovery_completed:   { icon: ShieldCheck, labelKey: 'admin.logRecovery',      color: 'bg-success/10 text-success' },
  breakglass_used:      { icon: Shield,      labelKey: 'admin.logBreakglass',    color: 'bg-danger/10 text-danger' },
}

const FALLBACK_CONFIG: ActionConfigEntry = { icon: ShieldCheck, labelKey: 'admin.logAction', color: 'bg-muted/10 text-muted' }

function actionText(log: AuditLog, t: TFunction): string {
  const name = log.targetName || null
  switch (log.action) {
    case 'user_joined':          return name ? t('admin.actUserJoined', { name }) : t('admin.actUserJoinedGeneric')
    case 'user_suspended':       return name ? t('admin.actUserSuspended', { name }) : t('admin.actUserSuspendedGeneric')
    case 'user_revoked':         return name ? t('admin.actUserRevoked', { name }) : t('admin.actUserRevokedGeneric')
    case 'user_activated':       return name ? t('admin.actUserActivated', { name }) : t('admin.actUserActivatedGeneric')
    case 'team_created':         return name ? t('admin.actTeamCreated', { name }) : t('admin.actTeamCreatedGeneric')
    case 'team_updated':         return name ? t('admin.actTeamUpdated', { name }) : t('admin.actTeamUpdatedGeneric')
    case 'team_deleted':         return name ? t('admin.actTeamDeleted', { name }) : t('admin.actTeamDeletedGeneric')
    case 'permission_changed':   return name ? t('admin.actPermChanged', { name }) : t('admin.actPermChangedGeneric')
    case 'document_added':       return name ? t('admin.actDocAdded', { name }) : t('admin.actDocAddedGeneric')
    case 'document_deleted':     return name ? t('admin.actDocDeleted', { name }) : t('admin.actDocDeletedGeneric')
    case 'invite_generated':     return t('admin.actInviteGen')
    case 'subscription_changed': return t('admin.actSubChanged')
    case 'organization_created': return t('admin.actOrgCreated')
    case 'admin_promoted':       return name ? t('admin.actAdminPromoted', { name }) : t('admin.actAdminPromotedGeneric')
    case 'admin_demoted':        return name ? t('admin.actAdminDemoted', { name }) : t('admin.actAdminDemotedGeneric')
    case 'recovery_initiated':
    case 'recovery_completed':   return t('admin.actRecovery')
    case 'breakglass_used':      return t('admin.actBreakglass')
    default: return t('admin.logAction')
  }
}

export function AdminJournal() {
  const { t, i18n } = useTranslation()
  const { currentOrg } = useAuth()

  const filterOptions: { value: 'all' | AuditAction; label: string }[] = [
    { value: 'all',               label: t('admin.journalFilterAll') },
    { value: 'user_joined',       label: t('admin.journalFilterUsers') },
    { value: 'team_created',      label: t('admin.journalFilterTeams') },
    { value: 'recovery_initiated',label: t('admin.journalFilterSecurity') },
  ]

  function formatTs(iso: string) {
    const d = new Date(iso)
    const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'pt' ? 'pt-BR' : 'en-GB'
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  const [filter, setFilter] = useState<'all' | AuditAction>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [allLogs, setAllLogs] = useState<AuditLog[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])

  useEffect(() => {
    AuditService.getLogs(currentOrg.id).then(setAllLogs)
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
  }, [currentOrg.id])

  function getActor(id: string | null) { return id ? orgUsers.find(u => u.id === id) : null }

  const base = allLogs.filter(l => {
    if (!ORG_AUDIT_ACTIONS.has(l.action)) return false
    if (filter !== 'all') {
      if (filter === 'user_joined') {
        if (!['user_joined', 'user_suspended', 'user_revoked', 'user_activated', 'invite_generated', 'admin_promoted', 'admin_demoted'].includes(l.action)) return false
      } else if (filter === 'team_created') {
        if (!['team_created', 'team_updated', 'team_deleted', 'permission_changed'].includes(l.action)) return false
      } else if (filter === 'recovery_initiated') {
        if (!['recovery_initiated', 'recovery_completed', 'breakglass_used'].includes(l.action)) return false
      } else if (l.action !== filter) return false
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      const text = `${l.targetName ?? ''} ${l.detail ?? ''} ${actionText(l, t)}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(base.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = base.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function changeFilter(f: typeof filter) { setFilter(f); setPage(1) }
  function changeQuery(q: string) { setQuery(q); setPage(1) }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">{t('admin.journalTitle')}</h1>
        <p className="text-sm text-muted mt-0.5">{t(base.length !== 1 ? 'admin.journalEntryCountPlural' : 'admin.journalEntryCount', { count: base.length })}</p>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input value={query} onChange={e => changeQuery(e.target.value)}
          placeholder={t('admin.journalSearch')}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {filterOptions.map(f => (
          <button key={f.value} onClick={() => changeFilter(f.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              filter === f.value ? 'bg-navy text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-4">
        {paged.length === 0 && (
          <div className="py-12 text-center text-sm text-muted">{t('admin.journalNoEntry')}</div>
        )}
        {paged.map((log, idx) => {
          const config = ACTION_CONFIG[log.action] ?? FALLBACK_CONFIG
          const actor = getActor(log.userId)
          const Icon = config.icon

          return (
            <div key={log.id} className={`flex items-start gap-4 px-5 py-4 ${idx < paged.length - 1 ? 'border-b border-border' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-ink leading-snug">{actionText(log, t)}</p>
                  <span className="text-[10px] text-faint shrink-0 mt-0.5">{formatTs(log.createdAt)}</span>
                </div>
                {log.detail && (
                  <p className="text-xs text-muted mt-0.5">{log.detail}</p>
                )}
                {actor && (
                  <p className="text-[10px] text-faint mt-1">
                    {t('common.by')} <span className="font-medium text-muted">{actor.firstName} {actor.lastName}</span>
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface border border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={15} /> {t('admin.journalPrev')}
          </button>
          <span className="text-xs text-muted">
            {t('admin.journalPage', { page: currentPage, total: totalPages })}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface border border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {t('admin.journalNext')} <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
