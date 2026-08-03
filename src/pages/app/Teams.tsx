import { useState, useEffect } from 'react'
import { Hash, Users, ChevronRight, ArrowLeft, FileText, MessageSquare, Crown, File, Table, ShieldCheck, Search, UserPlus, X, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { TeamService } from '../../services/team.service'
import { UserService } from '../../services/user.service'
import { DocumentService } from '../../services/document.service'
import { MessageService } from '../../services/message.service'
import { PermissionService } from '../../services/permission.service'
import { Avatar } from '../../components/ui/Avatar'
import { formatFileSize } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import type { Team, User, Document, Channel } from '../../lib/types'

function FileIcon({ type, size = 16 }: { type: string; size?: number }) {
  if (type === 'pdf')  return <FileText size={size} className="text-danger" />
  if (type === 'xlsx') return <Table    size={size} className="text-success" />
  return <File size={size} className="text-indigo" />
}

const TEAM_PERMS = [
  { key: 'invite_members',   labelKey: 'teams.inviteMembers',   descKey: 'teams.inviteMembersDesc'   },
  { key: 'manage_documents', labelKey: 'teams.manageDocuments', descKey: 'teams.manageDocumentsDesc' },
  { key: 'manage_events',    labelKey: 'teams.manageEvents',    descKey: 'teams.manageEventsDesc'    },
  { key: 'admin_space',      labelKey: 'teams.adminSpace',      descKey: 'teams.adminSpaceDesc'      },
]

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

function TeamDetail({ team, orgUsers, channels, onBack, onTeamUpdated }: {
  team: Team
  orgUsers: User[]
  channels: Channel[]
  onBack: () => void
  onTeamUpdated: (updated: Team) => void
}) {
  const { t } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'membres' | 'documents' | 'canal' | 'permissions' | 'parametres'>('membres')
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [permSaved, setPermSaved] = useState(false)
  const [permError, setPermError] = useState<string | null>(null)
  const [selectedMemberForPerms, setSelectedMemberForPerms] = useState<string | null>(null)
  const [memberPerms, setMemberPerms] = useState<Record<string, boolean>>({})
  const [memberPermSaved, setMemberPermSaved] = useState(false)
  const [memberPermError, setMemberPermError] = useState<string | null>(null)
  const [memberIds, setMemberIds] = useState<string[]>(team.members)
  const [memberQuery, setMemberQuery] = useState('')
  const [memberSaved, setMemberSaved] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [settings, setSettings] = useState({ name: team.name, description: team.description ?? '', color: team.color })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [docs, setDocs] = useState<Document[]>([])

  useEffect(() => {
    PermissionService.getTeamPerms(team.id).then(setPerms)
    DocumentService.getByTeam(team.id).then(setDocs)
  }, [team.id])

  useEffect(() => {
    if (!selectedMemberForPerms) return
    setMemberPermSaved(false)
    PermissionService.getMemberPerms(team.id, selectedMemberForPerms).then(loaded => {
      const defaults = Object.fromEntries(TEAM_PERMS.map(p => [p.key, false]))
      setMemberPerms({ ...defaults, ...loaded })
    })
  }, [team.id, selectedMemberForPerms])

  const channel = channels.find(c => c.teamId === team.id)
  const isResponsable = team.responsableId === currentUser.id

  const members = memberIds.map(id => orgUsers.find(u => u.id === id)).filter(Boolean) as User[]

  const memberSearchResults = memberQuery.length > 1
    ? orgUsers.filter(u =>
        u.status === 'active' &&
        u.role === 'member' &&
        !memberIds.includes(u.id) &&
        `${u.firstName} ${u.lastName} ${u.jobTitle ?? ''}`.toLowerCase().includes(memberQuery.toLowerCase())
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

  async function saveMembers() {
    setMemberError(null)
    const original = team.members
    const added = memberIds.filter(id => !original.includes(id))
    const removed = original.filter(id => !memberIds.includes(id))
    const results = await Promise.all([
      ...added.map(id => TeamService.addMember(team.id, id)),
      ...removed.map(id => TeamService.removeMember(team.id, id)),
    ])
    const firstError = results.find(r => r.error)
    if (firstError?.error) {
      setMemberError(firstError.error)
      return
    }
    onTeamUpdated({ ...team, members: memberIds })
    setMemberSaved(true)
    setTimeout(() => setMemberSaved(false), 2000)
  }

  function togglePerm(key: string) {
    if (!isResponsable) return
    setPerms(prev => ({ ...prev, [key]: !prev[key] }))
    setPermSaved(false)
  }

  async function savePerms() {
    setPermError(null)
    const { error } = await PermissionService.updateTeamPerms(team.id, perms)
    if (error) { setPermError(error); return }
    setPermSaved(true)
    setTimeout(() => setPermSaved(false), 2000)
  }

  async function saveMemberPerms() {
    if (!selectedMemberForPerms) return
    setMemberPermError(null)
    const { error } = await PermissionService.updateMemberPerms(team.id, selectedMemberForPerms, memberPerms)
    if (error) { setMemberPermError(error); return }
    setMemberPermSaved(true)
    setTimeout(() => setMemberPermSaved(false), 2000)
  }

  async function saveSettings() {
    setSettingsError(null)
    const { error } = await TeamService.update(
      team.id,
      { name: settings.name, description: settings.description || null, color: settings.color },
      currentOrg.id,
      currentUser.id,
    )
    if (error) { setSettingsError(error); return }
    onTeamUpdated({ ...team, name: settings.name, description: settings.description || undefined, color: settings.color })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-ink mb-5 transition-colors">
          <ArrowLeft size={16} /> {t('teams.backToTeams')}
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
            { id: 'membres',     label: t('teams.members'),     icon: Users        },
            { id: 'documents',   label: t('teams.documents'),   icon: FileText     },
            { id: 'canal',       label: t('teams.channel'),     icon: MessageSquare },
            { id: 'permissions', label: t('teams.permissions'), icon: ShieldCheck  },
            { id: 'parametres',  label: t('common.edit'),       icon: Settings     },
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
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border">
                  <Avatar firstName={m.firstName} lastName={m.lastName} id={m.id} size="md" src={m.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{m.firstName} {m.lastName}</span>
                      {m.id === team.responsableId && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber/10 text-amber text-[10px] font-semibold rounded-full">
                          <Crown size={9} /> {t('teams.responsible')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{m.jobTitle ?? (m.role === 'admin' ? t('common.administrator') : t('common.collaborator'))}</div>
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
                    placeholder={t('teams.addMember')}
                    className="w-full pl-9 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
                  />
                </div>

                {memberSearchResults.length > 0 && (
                  <div className="bg-surface border border-border rounded-xl overflow-hidden mb-3 divide-y divide-border">
                    {memberSearchResults.map(u => (
                      <button key={u.id} type="button" onClick={() => addMember(u.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors text-left">
                        <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-muted">{u.jobTitle ?? t('common.collaborator')}</div>
                        </div>
                        <UserPlus size={14} className="text-indigo shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {memberError && (
                  <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{memberError}</p>
                )}
                <button onClick={saveMembers}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                    memberSaved ? 'bg-success text-white' : 'bg-navy text-white hover:opacity-90'
                  }`}>
                  {memberSaved ? t('common.saved') : t('teams.inviteMembers')}
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
                <p className="text-sm text-muted">{t('teams.noDocuments')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => {
                  const owner = orgUsers.find(u => u.id === doc.ownerId)
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
                <p className="text-sm font-semibold text-ink mb-1">{t('teams.channelName', { name: team.name })}</p>
                <p className="text-xs text-muted mb-4">{t('teams.channelDesc')}</p>
                <button onClick={() => navigate('/app/messages')}
                  className="px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                  {t('teams.openInMessages')}
                </button>
              </div>
            ) : (
              <div className="py-16 text-center">
                <MessageSquare size={28} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">{t('teams.noChannel')}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'permissions' && (
          <div>
            {/* Team-level defaults (responsable only) */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('teams.defaultPermissions')}</div>
              {!isResponsable && (
                <div className="mb-3 p-3 bg-indigo-pale rounded-xl border border-indigo/10">
                  <p className="text-xs text-indigo">{t('teams.permissionsReadonly')}</p>
                </div>
              )}
              <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden mb-3">
                {TEAM_PERMS.map(perm => (
                  <div key={perm.key} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-sm font-medium text-ink">{t(perm.labelKey)}</div>
                      <div className="text-xs text-muted mt-0.5">{t(perm.descKey)}</div>
                    </div>
                    <Toggle on={perms[perm.key] ?? false} onChange={() => togglePerm(perm.key)} disabled={!isResponsable} />
                  </div>
                ))}
              </div>
              {isResponsable && (
                <>
                  {permError && <p className="text-xs text-danger">{permError}</p>}
                  <button onClick={savePerms}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                      permSaved ? 'bg-success text-white' : 'bg-navy text-white hover:opacity-90'
                    }`}>
                    {permSaved ? t('common.saved') : t('teams.permissions')}
                  </button>
                </>
              )}
            </div>

            {/* Per-member permissions (responsable only) */}
            {isResponsable && (
              <div>
                <div className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('teams.memberPermissions')}</div>
                <p className="text-xs text-muted mb-3">{t('teams.memberPermissionsDesc')}</p>

                {/* Member selector */}
                <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden mb-4">
                  {members.filter(m => m.id !== team.responsableId).map(m => (
                    <button key={m.id} type="button"
                      onClick={() => setSelectedMemberForPerms(prev => prev === m.id ? null : m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        selectedMemberForPerms === m.id ? 'bg-indigo/5' : 'hover:bg-bg'
                      }`}>
                      <Avatar firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" src={m.avatarUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink">{m.firstName} {m.lastName}</div>
                        <div className="text-xs text-muted">{m.jobTitle || t(m.role === 'admin' ? 'common.administrator' : 'common.collaborator')}</div>
                      </div>
                      <ChevronRight size={14} className={`text-faint transition-transform ${selectedMemberForPerms === m.id ? 'rotate-90' : ''}`} />
                    </button>
                  ))}
                  {members.filter(m => m.id !== team.responsableId).length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-muted">{t('teams.noOtherMembers')}</div>
                  )}
                </div>

                {/* Per-member toggles */}
                {selectedMemberForPerms && (() => {
                  const m = members.find(u => u.id === selectedMemberForPerms)
                  if (!m) return null
                  return (
                    <div className="bg-surface rounded-xl border border-indigo/20 overflow-hidden mb-3">
                      <div className="px-4 py-3 bg-indigo/5 border-b border-indigo/10 flex items-center gap-2">
                        <Avatar firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" src={m.avatarUrl} />
                        <span className="text-sm font-semibold text-ink">{m.firstName} {m.lastName}</span>
                      </div>
                      <div className="divide-y divide-border">
                        {TEAM_PERMS.map(perm => (
                          <div key={perm.key} className="flex items-center justify-between px-4 py-3.5">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="text-sm font-medium text-ink">{t(perm.labelKey)}</div>
                              <div className="text-xs text-muted mt-0.5">{t(perm.descKey)}</div>
                            </div>
                            <Toggle
                              on={memberPerms[perm.key] ?? false}
                              onChange={() => {
                                setMemberPerms(prev => ({ ...prev, [perm.key]: !prev[perm.key] }))
                                setMemberPermSaved(false)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t border-border space-y-2">
                        {memberPermError && <p className="text-xs text-danger">{memberPermError}</p>}
                        <button onClick={saveMemberPerms}
                          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                            memberPermSaved ? 'bg-success text-white' : 'bg-navy text-white hover:opacity-90'
                          }`}>
                          {memberPermSaved ? t('common.saved') : `${t('common.save')} (${m.firstName})`}
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {tab === 'parametres' && (
          <div className="space-y-5">
            {!isResponsable && (
              <div className="p-3 bg-indigo-pale rounded-xl border border-indigo/10">
                <p className="text-xs text-indigo">{t('teams.permissionsReadonly')}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('teams.teamName')}</label>
              <input
                value={settings.name}
                onChange={e => { setSettings(p => ({ ...p, name: e.target.value })); setSettingsSaved(false) }}
                disabled={!isResponsable}
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('teams.teamDescription')}</label>
              <textarea
                value={settings.description}
                onChange={e => { setSettings(p => ({ ...p, description: e.target.value })); setSettingsSaved(false) }}
                disabled={!isResponsable}
                rows={3}
                placeholder={t('teams.descriptionPlaceholder')}
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('teams.color')}</label>
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
              <div className="text-xs font-semibold text-ink mb-1 uppercase tracking-wide">{t('teams.responsible')}</div>
              {(() => {
                const resp = orgUsers.find(u => u.id === team.responsableId)
                return resp ? (
                  <div className="flex items-center gap-3 py-2">
                    <Avatar firstName={resp.firstName} lastName={resp.lastName} id={resp.id} size="sm" src={resp.avatarUrl} />
                    <div>
                      <div className="text-sm font-medium text-ink">{resp.firstName} {resp.lastName}</div>
                      <div className="text-xs text-muted">{resp.jobTitle || t(resp.role === 'admin' ? 'common.administrator' : 'common.collaborator')}</div>
                    </div>
                  </div>
                ) : null
              })()}
              <p className="text-xs text-faint mt-1">{t('teams.responsibleHint')}</p>
            </div>

            {settingsError && (
              <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{settingsError}</p>
            )}
            {isResponsable && (
              <button
                disabled={!settings.name.trim()}
                onClick={saveSettings}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 ${
                  settingsSaved ? 'bg-success text-white' : 'bg-navy text-white hover:opacity-90'
                }`}>
                {settingsSaved ? t('common.saved') : t('common.save')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function Teams() {
  const { t } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  useEffect(() => {
    TeamService.getByOrganizationWithMembers(currentOrg.id).then(all => {
      setMyTeams(all.filter(t => t.members.includes(currentUser.id)))
    })
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
    MessageService.getConversations(currentOrg.id, currentUser.id).then(setChannels)
  }, [currentUser.id, currentOrg.id])

  const selectedTeam = myTeams.find(t => t.id === selectedTeamId) ?? null

  if (selectedTeam) {
    return (
      <TeamDetail
        team={selectedTeam}
        orgUsers={orgUsers}
        channels={channels}
        onBack={() => setSelectedTeamId(null)}
        onTeamUpdated={updated => setMyTeams(prev => prev.map(t => t.id === updated.id ? updated : t))}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-ink">{t('teams.title')}</h2>
          <div className="text-xs text-muted">{myTeams.length} {myTeams.length > 1 ? t('teams.teams') : t('teams.team')}</div>
        </div>

        <div className="space-y-3">
          {myTeams.map(team => {
            const members = team.members.map(id => orgUsers.find(u => u.id === id)).filter(Boolean) as User[]
            const responsable = orgUsers.find(u => u.id === team.responsableId)
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
                        {members.slice(0, 4).map(m => (
                          <Avatar key={m.id} firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" src={m.avatarUrl} />
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
              <p className="text-sm text-muted">{t('teams.noTeams')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
