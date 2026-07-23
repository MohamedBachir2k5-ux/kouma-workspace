import { useState } from 'react'
import { Search, UserPlus, MoreHorizontal, UserX, UserCheck, Send, AlertTriangle, Link2, Copy, Check as CheckIcon } from 'lucide-react'
import { mockOrgUsers } from '../../lib/mock'
import { Avatar } from '../../components/ui/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../lib/types'

const statusLabel: Record<User['status'], string> = {
  active:    'Actif',
  invited:   'Invité',
  suspended: 'Suspendu',
  deleted:   'Révoqué',
}

const statusClass: Record<User['status'], string> = {
  active:    'bg-success/10 text-success',
  invited:   'bg-indigo-pale text-indigo',
  suspended: 'bg-amber/10 text-amber',
  deleted:   'bg-danger/10 text-danger',
}

type InviteStep = 'idle' | 'link' | 'copied'
type FilterValue = 'all' | 'active' | 'invited' | 'suspended'

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: 'all',       label: 'Tous' },
  { value: 'active',    label: 'Actifs' },
  { value: 'invited',   label: 'Invités' },
  { value: 'suspended', label: 'Suspendus' },
]

type ConfirmAction = { userId: string; action: 'suspend' | 'reactivate' | 'revoke' }

export function AdminUsers() {
  const { currentOrg } = useAuth()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteStep, setInviteStep] = useState<InviteStep>('idle')
  const [inviteLink, setInviteLink] = useState('')
  const [users, setUsers] = useState<User[]>(() => mockOrgUsers.filter(u => u.organizationId === currentOrg.id))
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)

  const visible = users.filter(u => u.status !== 'deleted')
  const filtered = visible.filter(u => {
    const name = `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase()
    if (query && !name.includes(query.toLowerCase())) return false
    if (filter !== 'all' && u.status !== filter) return false
    return true
  })

  function openConfirm(userId: string, action: ConfirmAction['action']) {
    setMenuOpen(null)
    setConfirm({ userId, action })
  }

  function executeConfirm() {
    if (!confirm) return
    setUsers(prev => prev.map(u => {
      if (u.id !== confirm.userId) return u
      if (confirm.action === 'suspend')    return { ...u, status: 'suspended' as const }
      if (confirm.action === 'reactivate') return { ...u, status: 'active' as const }
      if (confirm.action === 'revoke')     return { ...u, status: 'deleted' as const }
      return u
    }))
    setConfirm(null)
  }

  function generateLink() {
    // TODO Phase 3: call UserService.invite(email, currentOrg.id, currentUser.id) for real token
    const token = Math.random().toString(36).slice(2, 10)
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
  }

  const confirmUser = confirm ? users.find(u => u.id === confirm.userId) : null
  const confirmLabels: Record<ConfirmAction['action'], { title: string; body: string; cta: string; danger: boolean }> = {
    suspend:    { title: 'Suspendre l\'accès',  body: 'L\'accès sera bloqué immédiatement. Le compte reste récupérable.', cta: 'Suspendre',  danger: false },
    reactivate: { title: 'Réactiver le compte', body: 'L\'accès sera rétabli immédiatement.',                               cta: 'Réactiver',  danger: false },
    revoke:     { title: 'Révoquer l\'accès',   body: 'L\'accès sera définitivement supprimé. Fenêtre de récupération : 7 jours.', cta: 'Révoquer', danger: true },
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Utilisateurs</h1>
          <p className="text-sm text-muted mt-0.5">
            {visible.filter(u => u.status === 'active').length} actifs · {visible.length} au total
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Inviter</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
          />
        </div>
        <div className="flex gap-2">
          {FILTER_TABS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                filter === f.value ? 'bg-navy text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border bg-bg">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Utilisateur</span>
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Fonction</span>
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Département</span>
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Statut</span>
          <span />
        </div>

        {filtered.map((user, idx) => (
          <div
            key={user.id}
            className={`flex md:grid md:grid-cols-[1fr_1fr_1fr_auto_auto] items-center gap-4 px-5 py-4 relative ${
              idx < filtered.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar firstName={user.firstName} lastName={user.lastName} id={user.id} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-muted truncate md:hidden">{user.role}</div>
                <div className="text-xs text-faint truncate">{user.email}</div>
              </div>
            </div>

            <div className="hidden md:block text-sm text-ink truncate">{user.role}</div>
            <div className="hidden md:block text-sm text-muted truncate">{user.department || '—'}</div>

            <div className="ml-auto md:ml-0">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusClass[user.status]}`}>
                {statusLabel[user.status]}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen === user.id && (
                <div className="absolute right-0 top-8 z-20 w-48 bg-surface border border-border rounded-xl shadow-lg shadow-black/10 overflow-hidden">
                  {user.status === 'active' && (
                    <button
                      onClick={() => openConfirm(user.id, 'suspend')}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-bg transition-colors"
                    >
                      <UserX size={15} className="text-amber" /> Suspendre
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button
                      onClick={() => openConfirm(user.id, 'reactivate')}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-bg transition-colors"
                    >
                      <UserCheck size={15} className="text-success" /> Réactiver
                    </button>
                  )}
                  {user.status === 'invited' && (
                    <button
                      onClick={() => setMenuOpen(null)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-bg transition-colors"
                    >
                      <Send size={15} className="text-indigo" /> Renvoyer l'invitation
                    </button>
                  )}
                  {user.status !== 'deleted' && (
                    <button
                      onClick={() => openConfirm(user.id, 'revoke')}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left text-danger hover:bg-bg transition-colors border-t border-border"
                    >
                      <UserX size={15} /> Révoquer l'accès
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted">Aucun utilisateur trouvé.</div>
        )}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeInviteModal}>
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {inviteStep === 'idle' ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-pale mx-auto mb-4">
                  <Link2 size={22} className="text-indigo" />
                </div>
                <h3 className="font-bold text-navy text-lg mb-1 text-center">Inviter un collaborateur</h3>
                <p className="text-sm text-muted mb-5 text-center leading-relaxed">
                  Générez un lien sécurisé à partager directement avec vos collaborateurs. Chaque lien est unique et à usage unique.
                </p>
                <div className="p-4 bg-bg rounded-xl border border-border mb-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CheckIcon size={13} className="text-success shrink-0" />
                    Accès immédiat après inscription
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CheckIcon size={13} className="text-success shrink-0" />
                    Rattachement automatique à l'organisation
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CheckIcon size={13} className="text-success shrink-0" />
                    Lien expirant après 7 jours
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={closeInviteModal} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">
                    Annuler
                  </button>
                  <button onClick={generateLink}
                    className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Link2 size={15} /> Générer le lien
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mx-auto mb-4">
                  <UserCheck size={22} className="text-success" />
                </div>
                <h3 className="font-bold text-navy text-lg mb-1 text-center">Lien d'invitation prêt</h3>
                <p className="text-sm text-muted mb-4 text-center leading-relaxed">
                  Partagez ce lien avec votre collaborateur. Il expirera dans 7 jours.
                </p>
                <div className="flex items-center gap-2 p-3 bg-bg border border-border rounded-xl mb-5">
                  <span className="flex-1 text-xs text-indigo font-medium truncate">{inviteLink}</span>
                  <button
                    onClick={copyLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      inviteStep === 'copied'
                        ? 'bg-success text-white'
                        : 'bg-indigo-pale text-indigo hover:bg-indigo hover:text-white'
                    }`}
                  >
                    {inviteStep === 'copied'
                      ? <><CheckIcon size={12} /> Copié</>
                      : <><Copy size={12} /> Copier</>
                    }
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setInviteLink(''); setInviteStep('idle') }} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">
                    Nouveau lien
                  </button>
                  <button onClick={closeInviteModal} className="flex-1 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && confirmUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirm(null)}>
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
            <p className="text-xs text-muted text-center mb-5 leading-relaxed">
              {confirmLabels[confirm.action].body}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">
                Annuler
              </button>
              <button
                onClick={executeConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
                  confirmLabels[confirm.action].danger ? 'bg-danger' : 'bg-amber'
                }`}
              >
                {confirmLabels[confirm.action].cta}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  )
}
