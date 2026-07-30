import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, HardDrive, MessageSquare, FileText, UserCheck, UserX, Activity, TrendingUp, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { AlertTriangle } from 'lucide-react'
import { AuditService } from '../../services/audit.service'
import { DocumentService } from '../../services/document.service'
import { UserService } from '../../services/user.service'
import { MessageService } from '../../services/message.service'
import { Avatar } from '../../components/ui/Avatar'
import { formatFileSize, relativeDay } from '../../lib/utils'
import type { User, AuditLog, Document } from '../../lib/types'

const ACTION_ICON: Record<string, typeof UserCheck> = {
  user_joined:          UserCheck,
  user_suspended:       UserX,
  user_revoked:         UserX,
  user_activated:       UserCheck,
  document_added:       FileText,
  document_deleted:     FileText,
  team_created:         Users,
  team_updated:         Users,
  permission_changed:   Activity,
  invite_generated:     UserCheck,
  subscription_changed: TrendingUp,
}

const ACTION_LOG_KEY: Record<string, string> = {
  user_joined:          'admin.logUserJoined',
  user_suspended:       'admin.logUserSuspended',
  user_revoked:         'admin.logUserRevoked',
  user_activated:       'admin.logUserActivated',
  document_added:       'admin.logDocAdded',
  document_deleted:     'admin.logDocDeleted',
  team_created:         'admin.logTeamCreated',
  team_updated:         'admin.logTeamUpdated',
  team_deleted:         'admin.logTeamDeleted',
  permission_changed:   'admin.logPermChanged',
  invite_generated:     'admin.logInviteGen',
  subscription_changed: 'admin.logSubChanged',
  admin_promoted:       'admin.logAdminPromoted',
  admin_demoted:        'admin.logAdminDemoted',
  organization_created: 'admin.logOrgCreated',
}

const ACTION_COLOR: Record<string, string> = {
  user_joined:      'text-success',
  user_suspended:   'text-amber',
  user_revoked:     'text-danger',
  user_activated:   'text-success',
  document_added:   'text-indigo',
  document_deleted: 'text-danger',
  team_created:     'text-navy',
  team_updated:     'text-muted',
  invite_generated: 'text-indigo',
}

export function AdminDashboard() {
  const { t } = useTranslation()
  const { currentOrg, storageQuotaBytes, orgLoadError } = useAuth()

  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [storageUsed, setStorageUsed] = useState(0)
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [convCount, setConvCount] = useState(0)

  useEffect(() => {
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
    DocumentService.list(currentOrg.id).then(setDocs)
    DocumentService.totalUsed(currentOrg.id).then(setStorageUsed)
    AuditService.getRecent(currentOrg.id, 4).then(setRecentLogs)
    MessageService.countConversations(currentOrg.id).then(setConvCount)
  }, [currentOrg.id])

  const activeUsers  = orgUsers.filter(u => u.status === 'active')
  const suspended    = orgUsers.filter(u => u.status === 'suspended')

  const stats = [
    {
      label: t('admin.statActiveUsers'),
      value: String(activeUsers.length),
      sub: suspended.length > 1 ? t('admin.statSuspendedPlural', { count: suspended.length }) : t('admin.statSuspended', { count: suspended.length }),
      icon: Users,
      color: 'bg-indigo/10 text-indigo',
    },
    {
      label: t('admin.statStorage'),
      value: formatFileSize(storageUsed),
      sub: t('admin.statStorageOf', { value: formatFileSize(storageQuotaBytes) }),
      icon: HardDrive,
      color: 'bg-amber/10 text-amber',
    },
    {
      label: t('admin.statConversations'),
      value: String(convCount),
      sub: t('admin.statAllChannels'),
      icon: MessageSquare,
      color: 'bg-success/10 text-success',
    },
    {
      label: t('admin.statDocuments'),
      value: String(docs.length),
      sub: t('admin.statUsed', { value: formatFileSize(storageUsed) }),
      icon: FileText,
      color: 'bg-navy/10 text-navy',
    },
  ]

  const statusLabel = (status: User['status']) => {
    if (status === 'active') return t('admin.statusActive')
    if (status === 'suspended') return t('admin.statusSuspended')
    return t('admin.statusRevoked')
  }

  const quickActions = [
    { label: t('admin.quickInvite'),   to: '/admin/utilisateurs', icon: UserCheck },
    { label: t('admin.quickAddDept'),  to: '/admin/departements', icon: TrendingUp },
    { label: t('admin.quickStorage'),  to: '/admin/stockage',     icon: HardDrive },
    { label: t('admin.quickJournal'),  to: '/admin/journal',      icon: Activity },
  ]

  const workspaceStats = [
    { label: t('admin.statActiveUsers'),   value: activeUsers.length, total: orgUsers.length, color: 'bg-success', bytes: false },
    { label: t('admin.suspendedAccounts'), value: suspended.length,   total: orgUsers.length, color: 'bg-amber',   bytes: false },
    { label: t('admin.storage'),           value: storageUsed,        total: storageQuotaBytes, color: 'bg-indigo', bytes: true },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {orgLoadError && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{t('admin.orgNotLoaded')}</p>
            <p className="text-xs text-amber-700 mt-0.5">{orgLoadError}</p>
            <p className="text-xs text-amber-700 mt-1">{t('admin.orgNotLoadedHint')}</p>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">{t('admin.greeting')}</h1>
        <p className="text-sm text-muted mt-1">{t('admin.consoleOf')} · {currentOrg.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-ink mb-0.5">{value}</div>
            <div className="text-xs font-medium text-ink mb-1">{label}</div>
            <div className="text-[11px] text-muted">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent users */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">{t('admin.recentUsers')}</h2>
            <Link to="/admin/utilisateurs" className="text-xs text-indigo hover:underline font-medium">{t('admin.seeAll')}</Link>
          </div>
          <div className="space-y-3">
            {orgUsers.slice(0, 5).map(user => {
              const isAdmin = user.role === 'admin'
              return (
              <div key={user.id} className="flex items-center gap-3">
                {isAdmin ? (
                  currentOrg.logoUrl
                    ? <img src={currentOrg.logoUrl} alt={currentOrg.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-indigo/10 flex items-center justify-center shrink-0"><Shield size={15} className="text-indigo" /></div>
                ) : (
                  <Avatar firstName={user.firstName} lastName={user.lastName} id={user.id} size="sm" src={user.avatarUrl} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{isAdmin ? currentOrg.name : `${user.firstName} ${user.lastName}`}</div>
                  <div className="text-xs text-muted truncate">{isAdmin ? t('common.administrator') : t('common.collaborator')}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  user.status === 'active' ? 'bg-success/10 text-success' :
                  user.status === 'suspended' ? 'bg-amber/10 text-amber' :
                  'bg-danger/10 text-danger'
                }`}>
                  {statusLabel(user.status)}
                </span>
              </div>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">{t('admin.recentActivity')}</h2>
            <Link to="/admin/journal" className="text-xs text-indigo hover:underline font-medium">{t('admin.fullJournal')}</Link>
          </div>
          <div className="space-y-4">
            {recentLogs.map(log => {
              const actor = orgUsers.find(u => u.id === log.userId)
              const Icon  = ACTION_ICON[log.action] ?? Activity
              const color = ACTION_COLOR[log.action] ?? 'text-muted'
              return (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-bg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">
                      {actor && <span className="font-semibold">{actor.firstName} {actor.lastName} · </span>}
                      <span className="text-muted">{t(ACTION_LOG_KEY[log.action] ?? 'admin.logAction')}</span>
                    </p>
                    <p className="text-xs text-faint mt-0.5">{relativeDay(log.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-ink mb-4">{t('admin.quickActions')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to}
                className="flex flex-col gap-2 p-3 rounded-xl border border-border hover:border-indigo/30 hover:bg-bg transition-all">
                <Icon size={16} className="text-indigo" />
                <span className="text-xs font-medium text-ink leading-snug">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Workspace status */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-ink mb-4">{t('admin.workspaceStatus')}</h2>
          <div className="space-y-3">
            {workspaceStats.map(({ label, value, total, color, bytes }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted">{label}</span>
                  <span className="text-xs font-semibold text-ink">
                    {bytes ? `${formatFileSize(value)} / ${formatFileSize(total)}` : `${value} / ${total}`}
                  </span>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(100, total > 0 ? (value / total) * 100 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
