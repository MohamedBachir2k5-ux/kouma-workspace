import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, UserX, UserCheck, Send, AlertTriangle, Link2, Copy, Check as CheckIcon, Shield, ArrowLeft } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import { UserService } from '../../services/user.service'
import { OrganizationService } from '../../services/organization.service'
import { PLAN_USER_LIMITS } from '../../config/pricing'
import type { User } from '../../lib/types'

const statusClass: Record<User['status'], string> = {
  active:    'bg-success/10 text-success',
  invited:   'bg-indigo-pale text-indigo',
  suspended: 'bg-amber/10 text-amber',
  deleted:   'bg-danger/10 text-danger',
}

type InviteStep = 'idle' | 'link' | 'copied'
type FilterValue = 'all' | 'active' | 'invited' | 'suspended' | 'deleted'
type ConfirmAction = { userId: string; action: 'suspend' | 'reactivate' | 'revoke' }

function UserDetail({ user, orgUsers: _orgUsers, currentOrg, onBack, onAction, statusLabel, inGracePeriod }: {
  user: User
  orgUsers: User[]
  currentOrg: ReturnType<typeof useAuth>['currentOrg']
  onBack: () => void
  onAction: (userId: string, action: ConfirmAction['action']) => void
  statusLabel: Record<User['status'], string>
  inGracePeriod: (u: User) => boolean
}) {
  const { t } = useTranslation()
  const isAdmin = user.role === 'admin'

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-ink mb-5 transition-colors">
        <ArrowLeft size={16} /> {t('admin.backToUsers')}
      </button>

      {/* Profile card */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-4">
        <div className="flex items-start gap-4">
          {isAdmin ? (
            currentOrg.logoUrl
              ? <img src={currentOrg.logoUrl} alt={currentOrg.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
              : <div className="w-16 h-16 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0"><Shield size={28} className="text-indigo" /></div>
          ) : (
            <Avatar firstName={user.firstName} lastName={user.lastName} id={user.id} size="lg" src={user.avatarUrl} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {isAdmin ? currentOrg.name : `${user.firstName} ${user.lastName}`}
                </h2>
                {!isAdmin && <p className="text-sm text-muted">{user.email}</p>}
                {user.jobTitle && !isAdmin && <p className="text-sm text-faint mt-0.5">{user.jobTitle}</p>}
              </div>
              <span className={`mt-0.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                isAdmin ? 'bg-indigo/10 text-indigo' : statusClass[user.status]
              }`}>
                {isAdmin ? t('admin.roleOrg') : statusLabel[user.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{t('admin.colRole')}</div>
            <div className="text-sm text-ink flex items-center gap-1.5">
              {isAdmin && <Shield size={13} className="text-indigo" />}
              {isAdmin ? t('common.administrator') : t('common.collaborator')}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{t('admin.colDept')}</div>
            <div className="text-sm text-ink">{isAdmin ? '-' : (user.department || '-')}</div>
          </div>
          {!isAdmin && user.status === 'deleted' && user.deletedAt && inGracePeriod(user) && (
            <div className="col-span-2">
              <span className="text-xs text-amber font-medium">
                {t('admin.expiresOn', { date: new Date(new Date(user.deletedAt).getTime() + 7*24*60*60*1000).toLocaleDateString() })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Admin actions — only for non-admin accounts */}
      {!isAdmin && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-bold text-ink mb-3">{t('admin.adminActions')}</h3>
          <div className="space-y-2">
            {user.status === 'active' && (
              <button onClick={() => onAction(user.id, 'suspend')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber/20 text-amber hover:bg-amber/5 text-sm font-medium transition-colors text-left">
                <UserX size={16} /> {t('admin.actionSuspend')}
              </button>
            )}
            {user.status === 'suspended' && (
              <button onClick={() => onAction(user.id, 'reactivate')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-success/20 text-success hover:bg-success/5 text-sm font-medium transition-colors text-left">
                <UserCheck size={16} /> {t('admin.actionReactivate')}
              </button>
            )}
            {user.status === 'invited' && (
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo/20 text-indigo hover:bg-indigo/5 text-sm font-medium transition-colors text-left">
                <Send size={16} /> {t('admin.actionResendInvite')}
              </button>
            )}
            {user.status === 'deleted' && inGracePeriod(user) && (
              <button onClick={() => onAction(user.id, 'reactivate')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-success/20 text-success hover:bg-success/5 text-sm font-medium transition-colors text-left">
                <UserCheck size={16} /> {t('admin.actionRestore')}
              </button>
            )}
            {user.status !== 'deleted' && (
              <button onClick={() => onAction(user.id, 'revoke')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-danger/20 text-danger hover:bg-danger/5 text-sm font-medium transition-colors text-left">
                <UserX size={16} /> {t('admin.actionRevoke')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminUsers() {
  const { t } = useTranslation()
  const { currentOrg, currentUser, currentSubscription } = useAuth()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<InviteStep>('idle')
  const [inviteLink, setInviteLink] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [inviteExpiryDays, setInviteExpiryDays] = useState<number | null>(7)

  useEffect(() => {
    UserService.getByOrganizationWithRole(currentOrg.id).then(setUsers)
    OrganizationService.getSecuritySettings(currentOrg.id).then(s => setInviteExpiryDays(s.inviteExpiryDays))
  }, [currentOrg.id])

  const statusLabel: Record<User['status'], string> = {
    active:    t('admin.statusActive'),
    invited:   t('admin.statusInvited'),
    suspended: t('admin.statusSuspended'),
    deleted:   t('admin.statusRevoked'),
  }

  const FILTER_TABS: { value: FilterValue; label: string }[] = [
    { value: 'all',       label: t('admin.filterAll') },
    { value: 'active',    label: t('admin.filterActive') },
    { value: 'invited',   label: t('admin.filterInvited') },
    { value: 'suspended', label: t('admin.filterSuspended') },
    { value: 'deleted',   label: t('admin.filterRevoked') },
  ]

  const GRACE_DAYS = 7
  function inGracePeriod(u: User) {
    if (u.status !== 'deleted' || !u.deletedAt) return false
    const expiry = new Date(u.deletedAt).getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000
    return Date.now() < expiry
  }
  const visible = users.filter(u => u.status !== 'deleted' || inGracePeriod(u))
  const filtered = visible.filter(u => {
    const name = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase()
    if (query && !name.includes(query.toLowerCase())) return false
    if (filter !== 'all' && u.status !== filter) return false
    return true
  })

  function openConfirm(userId: string, action: ConfirmAction['action']) {
    if (userId === currentUser.id) return  // cannot act on own account
    setActionError(null)
    setConfirm({ userId, action })
  }

  async function executeConfirm() {
    if (!confirm) return
    setActionLoading(true)
    setActionError(null)

    const statusMap = { suspend: 'suspended', reactivate: 'active', revoke: 'deleted' } as const
    const newStatus = statusMap[confirm.action]
    await UserService.updateStatus(confirm.userId, currentOrg.id, newStatus, currentUser.id)
    setUsers(prev => prev.map(u => u.id === confirm.userId ? { ...u, status: newStatus } : u))
    setConfirm(null)
    setSelectedUserId(null)

    setActionLoading(false)
  }

  async function generateLink() {
    const userLimit = PLAN_USER_LIMITS[currentSubscription.plan]
    if (userLimit !== null) {
      const activeSeatCount = users.filter(u => u.status === 'active' || u.status === 'suspended' || u.status === 'invited').length
      if (activeSeatCount >= userLimit) {
        setInviteError(`Limite du plan ${currentSubscription.plan === 'free' ? 'Free' : 'Business'} atteinte (${userLimit} utilisateurs). Passez au plan supérieur pour inviter davantage de collaborateurs.`)
        return
      }
    }
    setInviteLoading(true)
    setInviteError(null)
    const { token, error } = await UserService.invite(currentOrg.id, currentUser.id, inviteExpiryDays)
    setInviteLoading(false)
    if (error || !token) {
      setInviteError(error ?? t('admin.inviteError'))
      return
    }
    setInviteLink(`${window.location.origin}/rejoindre/${token}`)
    setInviteStep('link')
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink).catch(() => {})
    setInviteStep('copied')
    setTimeout(() => setInviteStep('link'), 2000)
  }

  function closeInviteModal() {
    setShowInviteModal(false)
    setInviteLink('')
    setInviteStep('idle')
    setInviteError(null)
  }

  const confirmUser = confirm ? users.find(u => u.id === confirm.userId) : null
  const confirmLabels: Record<ConfirmAction['action'], { title: string; body: string; cta: string; danger: boolean }> = {
    suspend:    { title: t('admin.confirmSuspendTitle'),    body: t('admin.confirmSuspendBody'),    cta: t('admin.confirmSuspendCta'),    danger: false },
    reactivate: { title: t('admin.confirmReactivateTitle'), body: t('admin.confirmReactivateBody'), cta: t('admin.confirmReactivateCta'), danger: false },
    revoke:     { title: t('admin.confirmRevokeTitle'),     body: `${t('common.delete')}…`,         cta: t('admin.confirmRevokeCta'),     danger: true },
  }

  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null

  if (selectedUser) {
    return (
      <>
        <UserDetail
          user={selectedUser}
          orgUsers={users}
          currentOrg={currentOrg}
          onBack={() => setSelectedUserId(null)}
          onAction={openConfirm}
          statusLabel={statusLabel}
          inGracePeriod={inGracePeriod}
        />
        {/* Confirmation modal */}
        {confirm && confirmUser && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { if (!actionLoading) setConfirm(null) }}>
            <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-4 ${
                confirmLabels[confirm.action].danger ? 'bg-danger/10' : 'bg-amber/10'
              }`}>
                <AlertTriangle size={18} className={confirmLabels[confirm.action].danger ? 'text-danger' : 'text-amber'} />
              </div>
              <h3 className="font-bold text-navy text-base mb-1 text-center">{confirmLabels[confirm.action].title}</h3>
              <p className="text-sm text-muted text-center mb-1">
                <strong className="text-ink">{confirmUser.firstName} {confirmUser.lastName}</strong>
              </p>
              <p className="text-xs text-muted text-center mb-4 leading-relaxed">{confirmLabels[confirm.action].body}</p>
              {actionError && (
                <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mb-4 text-center">{actionError}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setConfirm(null); setActionError(null) }} disabled={actionLoading}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors disabled:opacity-40">
                  {t('common.cancel')}
                </button>
                <button onClick={executeConfirm} disabled={actionLoading}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${
                    confirmLabels[confirm.action].danger ? 'bg-danger' : 'bg-amber'
                  }`}>
                  {actionLoading ? t('admin.inProgress') : confirmLabels[confirm.action].cta}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{t('admin.usersTitle')}</h1>
          <p className="text-sm text-muted mt-0.5">
            {visible.filter(u => u.status === 'active').length} {t('admin.filterActive').toLowerCase()} · {visible.length} {t('common.total')}
          </p>
        </div>
        <button onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
          <UserPlus size={16} />
          <span className="hidden sm:inline">{t('admin.invite')}</span>
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={t('admin.searchUser')}
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                filter === f.value ? 'bg-navy text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted bg-surface rounded-xl border border-border">
          {t('admin.noUsersFound')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(user => {
            const isAdminRow = user.role === 'admin'
            return (
              <button key={user.id} onClick={() => setSelectedUserId(user.id)}
                className="text-left bg-surface rounded-xl border border-border p-4 hover:border-indigo/30 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  {isAdminRow ? (
                    currentOrg.logoUrl
                      ? <img src={currentOrg.logoUrl} alt={currentOrg.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-indigo/10 flex items-center justify-center shrink-0"><Shield size={18} className="text-indigo" /></div>
                  ) : (
                    <Avatar firstName={user.firstName} lastName={user.lastName} id={user.id} size="md" src={user.avatarUrl} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">
                      {isAdminRow ? currentOrg.name : `${user.firstName} ${user.lastName}`}
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5">
                      {isAdminRow ? t('common.administrator') : (user.department || user.jobTitle || t('common.collaborator'))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isAdminRow ? 'bg-indigo/10 text-indigo' : statusClass[user.status]
                  }`}>
                    {isAdminRow ? t('admin.roleOrg') : statusLabel[user.status]}
                  </span>
                  {!isAdminRow && user.status === 'deleted' && user.deletedAt && inGracePeriod(user) && (
                    <span className="text-[10px] text-amber font-medium">{t('admin.filterRevoked')}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeInviteModal}>
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {inviteStep === 'idle' ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-pale mx-auto mb-4">
                  <Link2 size={22} className="text-indigo" />
                </div>
                <h3 className="font-bold text-navy text-lg mb-1 text-center">{t('admin.inviteTitle')}</h3>
                <p className="text-sm text-muted mb-5 text-center leading-relaxed">{t('admin.inviteSubtitle')}</p>
                <div className="p-4 bg-bg rounded-xl border border-border mb-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CheckIcon size={13} className="text-success shrink-0" />{t('admin.immediateAccess')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CheckIcon size={13} className="text-success shrink-0" />{t('admin.autoAttach')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CheckIcon size={13} className="text-success shrink-0" />{t('admin.expiryNote')}
                  </div>
                </div>
                {inviteError && (
                  <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mb-4">{inviteError}</p>
                )}
                <div className="flex gap-3">
                  <button onClick={closeInviteModal} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">
                    {t('common.cancel')}
                  </button>
                  <button onClick={generateLink} disabled={inviteLoading}
                    className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    <Link2 size={15} /> {inviteLoading ? t('admin.generating') : t('admin.generateLink')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mx-auto mb-4">
                  <UserCheck size={22} className="text-success" />
                </div>
                <h3 className="font-bold text-navy text-lg mb-1 text-center">{t('admin.inviteLinkReady')}</h3>
                <p className="text-sm text-muted mb-4 text-center leading-relaxed">{t('admin.inviteLinkHint')}</p>
                <div className="flex items-center gap-2 p-3 bg-bg border border-border rounded-xl mb-5">
                  <span className="flex-1 text-xs text-indigo font-medium truncate">{inviteLink}</span>
                  <button onClick={copyLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      inviteStep === 'copied' ? 'bg-success text-white' : 'bg-indigo-pale text-indigo hover:bg-indigo hover:text-white'
                    }`}>
                    {inviteStep === 'copied' ? <><CheckIcon size={12} /> {t('admin.copied')}</> : <><Copy size={12} /> {t('admin.copy')}</>}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setInviteLink(''); setInviteStep('idle') }} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">
                    {t('admin.newLink')}
                  </button>
                  <button onClick={closeInviteModal} className="flex-1 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                    {t('admin.close')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
