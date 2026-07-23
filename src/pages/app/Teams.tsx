import { useState } from 'react'
import { Hash, Users, ChevronRight, ArrowLeft, FileText, MessageSquare, Crown, File, Table, ShieldCheck, Search, UserPlus, X, Settings } from 'lucide-react'
import { mockTeams, mockOrgUsers, mockDocuments, mockChannels } from '../../lib/mock'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar } from '../../components/ui/Avatar'
import { formatFileSize } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

function FileIcon({ type, size = 16 }: { type: string; size?: number }) {
  if (type === 'pdf')  return <FileText size={size} className="text-danger" />
  if (type === 'xlsx') return <Table    size={size} className="text-success" />
  return <File size={size} className="text-indigo" />
}

const TEAM_PERMS = [
  { key: 'invite_members',   label: 'Inviter des membres',  desc: 'Inviter de nouveaux membres dans l\'équipe' },
  { key: 'manage_documents', label: 'Gérer les documents',  desc: 'Créer, modifier et supprimer les documents' },
  { key: 'manage_events',    label: 'Gérer l\'agenda',      desc: 'Créer et modifier les événements de l\'équipe' },
  { key: 'admin_space',      label: 'Administrer',          desc: 'Modifier les paramètres de l\'équipe' },
]

const DEFAULT_PERMS: Record<string, Record<string, boolean>> = {
  t1: { invite_members: true,  manage_documents: true,  manage_events: true,  admin_space: true  },
  t2: { invite_members: false, manage_documents: true,  manage_events: true,  admin_space: false },
  t3: { invite_members: true,  manage_documents: true,  manage_events: false, admin_space: false },
  t4: { invite_members: false, manage_documents: false, manage_events: true,  admin_space: false },
  t5: { invite_members: true,  manage_documents: true,  manage_events: true,  admin_space: false },
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onChange} disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
        on ? 'bg-success' : 'bg-border'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

const TEAM_COLORS = ['#0f1628', '#4f46e5', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9']

function TeamDetail({ teamId, onBack }: { teamId: string; onBack: () => void }) {
  const { currentUser } = useAuth()
  const [tab, setTab] = useState<'membres' | 'documents' | 'canal' | 'permissions' | 'parametres'>('membres')
  const [perms, setPerms] = useState<Record<string, boolean>>(
    DEFAULT_PERMS[teamId] ?? { invite_members: false, manage_documents: false, manage_events: false, admin_space: false }
  )
  const [permSaved, setPermSaved] = useState(false)
  const [memberIds, setMemberIds] = useState<string[]>(
    mockTeams.find(t => t.id === teamId)?.members ?? []
  )
  const [memberQuery, setMemberQuery] = useState('')
  const [memberSaved, setMemberSaved] = useState(false)
  const navigate = useNavigate()
  const team = mockTeams.find(t => t.id === teamId)!
  const [settings, setSettings] = useState({ name: team.name, description: team.description ?? '', color: team.color })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const docs = mockDocuments.filter(d => d.teamId === teamId)
  const channel = mockChannels.find(c => c.teamId === teamId)
  const isResponsable = team.responsableId === currentUser.id

  const members = memberIds.map(id => mockOrgUsers.find(u => u.id === id)).filter(Boolean)

  const memberSearchResults = memberQuery.length > 1
    ? mockOrgUsers.filter(u =>
        u.status === 'active' &&
        !memberIds.includes(u.id) &&
        `${u.firstName} ${u.lastName} ${u.role}`.toLowerCase().includes(memberQuery.toLowerCase())
      )
    : []

  function removeMember(id: string) {
    setMemberIds(prev => prev.filter(m => m !== id))
    setMemberSaved(false)
  }

  function addMember(id: string) {
    setMemberIds(prev => [...prev, id])
    setMemberQuery('')
    setMemberSaved(false)
  }

  function saveMembers() {
    // TODO: TeamService.updateMembers(team.id, memberIds) in Étape 3
    setMemberSaved(true)
    setTimeout(() => setMemberSaved(false), 2000)
  }

  function togglePerm(key: string) {
    if (!isResponsable) return
    setPerms(prev => ({ ...prev, [key]: !prev[key] }))
    setPermSaved(false)
  }

  function savePerms() {
    setPermSaved(true)
    setTimeout(() => setPermSaved(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-ink mb-5 transition-colors">
          <ArrowLeft size={16} /> Retour aux équipes
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: team.color }}>
            <Hash size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">{team.name}</h2>
            {team.description && <p className="text-sm text-muted mt-0.5 leading-relaxed">{team.description}</p>}
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-bg rounded-xl border border-border mb-5 w-fit overflow-x-auto">
          {([
            { id: 'membres',     label: 'Membres',     icon: Users        },
            { id: 'documents',   label: 'Documents',   icon: FileText     },
            { id: 'canal',       label: 'Canal',       icon: MessageSquare },
            { id: 'permissions', label: 'Permissions', icon: ShieldCheck  },
            { id: 'parametres',  label: 'Paramètres',  icon: Settings     },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {tab === 'membres' && (
          <div>
            <div className="space-y-2 mb-4">
              {members.map(m => m && (
                <div key={m.id} className="flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border">
                  <Avatar firstName={m.firstName} lastName={m.lastName} id={m.id} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{m.firstName} {m.lastName}</span>
                      {m.id === team.responsableId && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber/10 text-amber text-[10px] font-semibold rounded-full">
                          <Crown size={9} /> Responsable
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{m.role}</div>
                  </div>
                  {isResponsable && m.id !== team.responsableId ? (
                    <button onClick={() => removeMember(m.id)}
                      className="p-1.5 rounded-lg text-faint hover:text-danger hover:bg-danger/5 transition-colors">
                      <X size={15} />
                    </button>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-success' : 'bg-amber'}`} />
                  )}
                </div>
              ))}
            </div>

            {isResponsable && (
              <div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                  <input
                    value={memberQuery}
                    onChange={e => setMemberQuery(e.target.value)}
                    placeholder="Ajouter un membre…"
                    className="w-full pl-9 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
                  />
                </div>

                {memberSearchResults.length > 0 && (
                  <div className="bg-surface border border-border rounded-xl overflow-hidden mb-3 divide-y divide-border">
                    {memberSearchResults.map(u => (
                      <button key={u.id} type="button" onClick={() => addMember(u.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors text-left">
                        <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-muted">{u.role}</div>
                        </div>
                        <UserPlus size={14} className="text-indigo shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={saveMembers}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                    memberSaved ? 'bg-success text-white' : 'bg-navy text-white hover:opacity-90'
                  }`}>
                  {memberSaved ? 'Enregistré' : 'Enregistrer les membres'}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <div>
            {docs.length === 0 ? (
              <div className="py-16 text-center">
                <FileText size={28} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">Aucun document partagé dans cette équipe.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => {
                  const owner = mockOrgUsers.find(u => u.id === doc.ownerId)
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border hover:border-indigo/30 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center shrink-0">
                        <FileIcon type={doc.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{doc.name}</div>
                        <div className="text-xs text-muted">{formatFileSize(doc.size)}{owner ? ` · ${owner.firstName} ${owner.lastName}` : ''}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'canal' && (
          <div>
            {channel ? (
              <div className="bg-surface rounded-xl border border-border p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare size={22} className="text-indigo" />
                </div>
                <p className="text-sm font-semibold text-ink mb-1">Canal #{team.name}</p>
                <p className="text-xs text-muted mb-4">Les échanges de cette équipe sont dans la messagerie.</p>
                <button onClick={() => navigate('/app/messages')}
                  className="px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                  Ouvrir dans Messagerie
                </button>
              </div>
            ) : (
              <div className="py-16 text-center">
                <MessageSquare size={28} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">Aucun canal associé à cette équipe.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'permissions' && (
          <div>
            {!isResponsable && (
              <div className="mb-4 p-3 bg-indigo-pale rounded-xl border border-indigo/10">
                <p className="text-xs text-indigo">Seul le responsable de l'équipe peut modifier les permissions.</p>
              </div>
            )}
            <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden mb-4">
              {TEAM_PERMS.map(perm => (
                <div key={perm.key} className="flex items-center justify-between px-4 py-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm font-medium text-ink">{perm.label}</div>
                    <div className="text-xs text-muted mt-0.5">{perm.desc}</div>
                  </div>
                  <Toggle on={perms[perm.key] ?? false} onChange={() => togglePerm(perm.key)} disabled={!isResponsable} />
                </div>
              ))}
            </div>
            {isResponsable && (
              <button onClick={savePerms}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                  permSaved ? 'bg-success text-white' : 'bg-navy text-white hover:opacity-90'
                }`}>
                {permSaved ? 'Enregistré' : 'Enregistrer'}
              </button>
            )}
          </div>
        )}

        {tab === 'parametres' && (
          <div className="space-y-5">
            {!isResponsable && (
              <div className="p-3 bg-indigo-pale rounded-xl border border-indigo/10">
                <p className="text-xs text-indigo">Seul le responsable peut modifier les paramètres de l'équipe.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Nom de l'équipe</label>
              <input
                value={settings.name}
                onChange={e => { setSettings(p => ({ ...p, name: e.target.value })); setSettingsSaved(false) }}
                disabled={!isResponsable}
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Description</label>
              <textarea
                value={settings.description}
                onChange={e => { setSettings(p => ({ ...p, description: e.target.value })); setSettingsSaved(false) }}
                disabled={!isResponsable}
                rows={3}
                placeholder="Rôle et périmètre de cette équipe…"
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Couleur</label>
              <div className="flex gap-2.5">
                {TEAM_COLORS.map(c => (
                  <button key={c} type="button"
                    disabled={!isResponsable}
                    onClick={() => { setSettings(p => ({ ...p, color: c })); setSettingsSaved(false) }}
                    className="w-7 h-7 rounded-full border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: c, borderColor: settings.color === c ? c : 'transparent', outline: settings.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-1 border-t border-border">
              <div className="text-xs font-semibold text-ink mb-1 uppercase tracking-wide">Responsable</div>
              {(() => {
                const resp = mockOrgUsers.find(u => u.id === team.responsableId)
                return resp ? (
                  <div className="flex items-center gap-3 py-2">
                    <Avatar firstName={resp.firstName} lastName={resp.lastName} id={resp.id} size="sm" />
                    <div>
                      <div className="text-sm font-medium text-ink">{resp.firstName} {resp.lastName}</div>
                      <div className="text-xs text-muted">{resp.role}</div>
                    </div>
                  </div>
                ) : null
              })()}
              <p className="text-xs text-faint mt-1">Le responsable est désigné par l'administrateur de l'organisation.</p>
            </div>

            {isResponsable && (
              <button
                disabled={!settings.name.trim()}
                onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2000) }}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 ${
                  settingsSaved ? 'bg-success text-white' : 'bg-navy text-white hover:opacity-90'
                }`}>
                {settingsSaved ? 'Enregistré' : 'Enregistrer les paramètres'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function Teams() {
  const { currentUser } = useAuth()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const myTeams = mockTeams.filter(t => t.members.includes(currentUser.id))

  if (selectedTeamId) {
    return <TeamDetail teamId={selectedTeamId} onBack={() => setSelectedTeamId(null)} />
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-ink">Mes équipes</h2>
          <div className="text-xs text-muted">{myTeams.length} équipe{myTeams.length > 1 ? 's' : ''}</div>
        </div>

        <div className="space-y-3">
          {myTeams.map(team => {
            const members = team.members.map(id => mockOrgUsers.find(u => u.id === id)).filter(Boolean)
            const responsable = mockOrgUsers.find(u => u.id === team.responsableId)
            return (
              <button key={team.id} onClick={() => setSelectedTeamId(team.id)}
                className="w-full text-left bg-surface rounded-xl border border-border p-4 hover:border-indigo/30 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: team.color }}>
                    <Hash size={17} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-ink text-sm">{team.name}</h3>
                      <ChevronRight size={16} className="text-faint shrink-0" />
                    </div>
                    {team.description && (
                      <p className="text-xs text-muted mb-2 leading-relaxed line-clamp-1">{team.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {members.slice(0, 4).map(m => m && (
                          <Avatar key={m.id} firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" />
                        ))}
                      </div>
                      {responsable && (
                        <div className="flex items-center gap-1 text-[10px] text-muted">
                          <Crown size={10} />
                          {responsable.firstName} {responsable.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}

          {myTeams.length === 0 && (
            <div className="py-16 text-center">
              <Users size={28} className="text-faint mx-auto mb-3" />
              <p className="text-sm text-muted">Vous n'appartenez à aucune équipe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
