import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Hash, User, Lock, Paperclip, FolderInput, Check, Info, ArrowLeft, X, Bell, BellOff, Star, Link2, Image, Crown, FileText, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { MessageService } from '../../services/message.service'
import { UserService } from '../../services/user.service'
import { TeamService } from '../../services/team.service'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { formatTime, formatFileSize } from '../../lib/utils'
import type { Channel, Message, User as AppUser, Team } from '../../lib/types'

/* ── Types ── */
type ConvType = 'direct' | 'group' | 'team'

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

function fileIcon(type: string) {
  if (/^image\//i.test(type)) return <Image size={13} className="text-indigo" />
  return <Paperclip size={13} className="text-indigo" />
}

const sectionLabel: Record<ConvType, string> = {
  direct: 'Directs',
  group: 'Groupes',
  team: 'Équipes',
}

/* ── New group modal ── */
function NewGroupModal({ onClose, orgUsers, onCreated }: {
  onClose: () => void
  orgUsers: AppUser[]
  onCreated: () => void
}) {
  const { currentUser, currentOrg } = useAuth()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  function toggle(id: string) { setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  async function handleCreate() {
    if (!name.trim() || selected.length === 0 || creating) return
    setCreating(true)
    await MessageService.createGroupConversation(currentOrg.id, [currentUser.id, ...selected])
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy text-base">Nouveau groupe</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Discussion privée entre collègues. Les fichiers envoyés restent des pièces jointes privées à ce groupe.
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Nom du groupe</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Coordination projet" autoFocus
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Participants ({selected.length})</label>
            <div className="max-h-44 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {orgUsers.filter(u => u.id !== currentUser.id && u.status === 'active').map(u => (
                <button key={u.id} type="button" onClick={() => toggle(u.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${selected.includes(u.id) ? 'bg-indigo-pale' : 'hover:bg-bg'}`}>
                  <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ink truncate">{u.firstName} {u.lastName}</div>
                    <div className="text-[10px] text-muted">{u.role}</div>
                  </div>
                  {selected.includes(u.id) && <Check size={13} className="text-indigo shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
          <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || creating}
            className="flex-1 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {creating ? 'Création…' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Promote modal ── */
function PromoteModal({ file, onClose }: { file: Attachment; onClose: () => void }) {
  const [destination, setDestination] = useState<'root' | 'f1' | 'f2'>('root')
  const [done, setDone] = useState(false)

  const options = [
    { id: 'root', label: 'Bibliothèque générale', desc: "Document accessible à toute l'organisation, sans classement par équipe." },
    { id: 'f1',   label: 'Finance',               desc: "Visible uniquement par les membres de l'équipe Finance." },
    { id: 'f2',   label: 'Ressources Humaines',   desc: "Visible uniquement par les membres de l'équipe RH." },
  ] as const

  function confirm() { setDone(true); setTimeout(onClose, 1400) }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-navy text-base">Ajouter aux documents</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Ce fichier deviendra un document officiel du workspace, classé selon la destination choisie.
        </p>
        <div className="p-3 bg-bg rounded-xl border border-border mb-4 flex items-center gap-3">
          <Paperclip size={15} className="text-indigo shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink truncate">{file.name}</div>
            <div className="text-xs text-muted">{formatFileSize(file.size)}</div>
          </div>
        </div>
        <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Destination</label>
        <div className="space-y-2 mb-4">
          {options.map(opt => (
            <button key={opt.id} type="button" onClick={() => setDestination(opt.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                destination === opt.id ? 'border-indigo bg-indigo-pale' : 'border-border hover:border-indigo/30'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                destination === opt.id ? 'border-indigo bg-indigo' : 'border-border'
              }`}>
                {destination === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{opt.label}</div>
                <div className="text-xs text-muted mt-0.5 leading-relaxed">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
          <button onClick={confirm}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors ${done ? 'bg-success' : 'bg-indigo hover:opacity-90'}`}>
            {done ? 'Ajouté !' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Conversation info panel ── */
type LibrarySection = 'files' | 'links' | 'starred'

function InfoPanel({ channel, orgUsers, teams, attachments, onClose, onNavigateToDocs, onLeave }: {
  channel: Channel
  orgUsers: AppUser[]
  teams: Team[]
  attachments: Attachment[]
  onClose: () => void
  onNavigateToDocs: () => void
  onLeave: () => void
}) {
  const { currentUser } = useAuth()
  const type = channel.type as ConvType
  const MUTED_KEY = `muted_conv_${channel.id}`
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTED_KEY) === '1')
  const [libraryOpen, setLibraryOpen] = useState<LibrarySection | null>(null)

  const otherMemberId = channel.members.find(id => id !== currentUser.id) ?? ''
  const otherUser = orgUsers.find(u => u.id === otherMemberId)
  const allMembers = channel.members.map(id => orgUsers.find(u => u.id === id)).filter(Boolean)

  const team = type === 'team' && channel.teamId ? teams.find(t => t.id === channel.teamId) : null
  const teamResponsable = team ? orgUsers.find(u => u.id === team.responsableId) : null
  const teamMembers = team
    ? team.members.map(id => orgUsers.find(u => u.id === id)).filter(Boolean)
    : allMembers

  function SectionHeader({ label }: { label: string }) {
    return <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</h3>
  }

  const libraryTitles: Record<LibrarySection, string> = {
    files: 'Fichiers partagés',
    links: 'Liens partagés',
    starred: 'Éléments importants',
  }

  if (libraryOpen) {
    return (
      <div className="flex flex-col h-full bg-bg">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
          <button onClick={() => setLibraryOpen(null)} className="p-1.5 rounded-lg text-muted hover:text-ink">
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-ink">{libraryTitles[libraryOpen]}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {libraryOpen === 'files' && (
            attachments.length === 0 ? (
              <div className="py-16 text-center">
                <Paperclip size={28} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">Aucun fichier partagé dans cette conversation.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                    <Paperclip size={14} className="text-indigo shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{att.name}</div>
                      <div className="text-xs text-muted">{formatFileSize(att.size)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {libraryOpen === 'links' && (
            <div className="py-16 text-center">
              <Link2 size={28} className="text-faint mx-auto mb-3" />
              <p className="text-sm text-muted">Aucun lien partagé dans cette conversation.</p>
            </div>
          )}
          {libraryOpen === 'starred' && (
            <div className="py-16 text-center">
              <Star size={28} className="text-faint mx-auto mb-3" />
              <p className="text-sm text-muted">Aucun élément important dans cette conversation.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-ink">
          {type === 'direct' ? 'Profil' : type === 'group' ? 'Infos du groupe' : "Infos de l'équipe"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Identity */}
        <div className="flex flex-col items-center py-8 px-4 border-b border-border bg-surface">
          {type === 'direct' && otherUser ? (
            <>
              <Avatar firstName={otherUser.firstName} lastName={otherUser.lastName} id={otherUser.id} size="xl" />
              <h2 className="font-bold text-ink text-base mt-3">{otherUser.firstName} {otherUser.lastName}</h2>
              <p className="text-sm text-muted">{otherUser.role}</p>
              <span className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                otherUser.status === 'active' ? 'bg-success/10 text-success' : 'bg-amber/10 text-amber'
              }`}>
                {otherUser.status === 'active' ? 'Actif' : 'Suspendu'}
              </span>
            </>
          ) : type === 'group' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-indigo-pale flex items-center justify-center mb-3">
                <Lock size={24} className="text-indigo" />
              </div>
              <h2 className="font-bold text-ink text-base">{channel.name}</h2>
              <p className="text-sm text-muted">{allMembers.length} membres · Groupe privé</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-navy/10 flex items-center justify-center mb-3">
                <Hash size={24} className="text-navy" />
              </div>
              <h2 className="font-bold text-ink text-base">{channel.name}</h2>
              <p className="text-sm text-muted">{teamMembers.length} membres · Espace d'équipe</p>
            </>
          )}
        </div>

        {/* Responsable — team only */}
        {type === 'team' && teamResponsable && (
          <div className="px-4 py-4 border-b border-border">
            <SectionHeader label="Responsable" />
            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border mt-3">
              <Avatar firstName={teamResponsable.firstName} lastName={teamResponsable.lastName} id={teamResponsable.id} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{teamResponsable.firstName} {teamResponsable.lastName}</div>
                <div className="text-xs text-muted">{teamResponsable.role}</div>
              </div>
              <Crown size={14} className="text-amber shrink-0" />
            </div>
          </div>
        )}

        {/* Members */}
        {(type === 'group' || type === 'team') && (
          <div className="px-4 py-4 border-b border-border">
            <SectionHeader label={`Membres · ${(type === 'team' ? teamMembers : allMembers).length}`} />
            <div className="space-y-2 mt-3">
              {(type === 'team' ? teamMembers : allMembers).map(m => m && (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <Avatar firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{m.firstName} {m.lastName}</div>
                    <div className="text-xs text-muted">{m.role}</div>
                  </div>
                  {m.id === currentUser.id && <span className="text-[10px] font-semibold text-indigo bg-indigo-pale px-1.5 py-0.5 rounded-full">Vous</span>}
                  {type === 'team' && team?.responsableId === m.id && m.id !== currentUser.id && <Crown size={12} className="text-amber shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared files */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader label="Fichiers partagés" />
            {attachments.length > 0 && (
              <button onClick={() => setLibraryOpen('files')} className="text-xs text-indigo font-medium hover:underline">
                Voir tout ({attachments.length})
              </button>
            )}
          </div>
          {attachments.length === 0 ? (
            <button onClick={() => setLibraryOpen('files')}
              className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-indigo/30 transition-colors text-left">
              <Paperclip size={14} className="text-faint shrink-0" />
              <span className="text-xs text-muted">Voir les fichiers partagés →</span>
            </button>
          ) : (
            <div className="space-y-2">
              {attachments.slice(0, 2).map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <Paperclip size={14} className="text-indigo shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{att.name}</div>
                    <div className="text-xs text-muted">{formatFileSize(att.size)}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => setLibraryOpen('files')}
                className="w-full py-2.5 text-xs text-indigo font-medium border border-indigo/20 rounded-xl hover:bg-indigo-pale transition-colors">
                Voir tous les fichiers →
              </button>
            </div>
          )}
        </div>

        {/* Team documents */}
        {type === 'team' && (
          <div className="px-4 py-4 border-b border-border">
            <div className="mb-3"><SectionHeader label="Documents de l'équipe" /></div>
            <button onClick={onNavigateToDocs} className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-indigo/40 transition-colors text-left">
              <FileText size={14} className="text-indigo shrink-0" />
              <span className="text-sm text-indigo font-medium">Voir dans la bibliothèque →</span>
            </button>
          </div>
        )}

        {/* Shared links */}
        <div className="px-4 py-4 border-b border-border">
          <div className="mb-3"><SectionHeader label="Liens partagés" /></div>
          <button onClick={() => setLibraryOpen('links')}
            className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-indigo/30 transition-colors text-left">
            <Link2 size={14} className="text-faint shrink-0" />
            <span className="text-xs text-muted">Voir les liens partagés →</span>
          </button>
        </div>

        {/* Media — group & team */}
        {(type === 'group' || type === 'team') && (
          <div className="px-4 py-4 border-b border-border">
            <div className="mb-3"><SectionHeader label="Médias" /></div>
            <div className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-border text-faint">
              <Image size={14} className="shrink-0" />
              <span className="text-xs">Les images et vidéos envoyées apparaîtront ici.</span>
            </div>
          </div>
        )}

        {/* Starred / important */}
        {type === 'direct' && (
          <div className="px-4 py-4 border-b border-border">
            <div className="mb-3"><SectionHeader label="Éléments importants" /></div>
            <button onClick={() => setLibraryOpen('starred')}
              className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-indigo/30 transition-colors text-left">
              <Star size={14} className="text-faint shrink-0" />
              <span className="text-xs text-muted">Voir les éléments importants →</span>
            </button>
          </div>
        )}

        {/* Options */}
        <div className="px-4 py-4 space-y-2">
          <div className="mb-3"><SectionHeader label="Options" /></div>
          <div className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-border">
            <div className="flex items-center gap-3">
              {muted ? <BellOff size={16} className="text-muted" /> : <Bell size={16} className="text-muted" />}
              <span className="text-sm text-ink">Notifications</span>
            </div>
            <button type="button" onClick={() => {
              const next = !muted
              setMuted(next)
              if (next) localStorage.setItem(MUTED_KEY, '1')
              else localStorage.removeItem(MUTED_KEY)
            }}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${muted ? 'bg-border' : 'bg-success'}`}>
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${muted ? 'translate-x-0.5' : 'translate-x-4'}`} />
            </button>
          </div>
          {type === 'group' && (
            <button onClick={() => { if (window.confirm('Quitter ce groupe ? Vous ne pourrez plus accéder aux messages.')) onLeave() }}
              className="w-full flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border text-left hover:border-danger/40 transition-colors">
              <LogOut size={16} className="text-danger shrink-0" />
              <span className="text-sm text-danger">Quitter le groupe</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Conversation list ── */
function ConvList({ channels, onSelect, selected, onNewGroup }: {
  channels: Channel[]
  onSelect: (id: string) => void
  selected: string | null
  onNewGroup: () => void
}) {
  const [query, setQuery] = useState('')

  const byType: Record<ConvType, Channel[]> = { direct: [], group: [], team: [] }
  channels.forEach(c => {
    const filtered = !query || c.name.toLowerCase().includes(query.toLowerCase())
    if (filtered) byType[c.type as ConvType].push(c)
  })

  const sections: { type: ConvType; items: Channel[] }[] = [
    { type: 'direct' as ConvType, items: byType.direct },
    { type: 'group' as ConvType, items: byType.group },
    { type: 'team' as ConvType, items: byType.team },
  ].filter(s => s.items.length > 0)

  function getAvatarParts(ch: Channel) {
    const parts = ch.name.split(' ')
    return { firstName: parts[0] ?? '', lastName: parts[1] ?? '' }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-ink">Messagerie</h2>
          <button onClick={onNewGroup} title="Nouveau groupe"
            className="w-8 h-8 rounded-full bg-indigo-pale flex items-center justify-center text-indigo hover:bg-indigo hover:text-white transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sections.map(({ type, items }) => (
          <div key={type} className="mb-2">
            <p className="text-[10px] font-semibold text-faint uppercase tracking-wider px-3 py-2">{sectionLabel[type]}</p>
            {items.map(ch => {
              const isTeam = type === 'team'
              const isGroup = type === 'group'
              const { firstName, lastName } = getAvatarParts(ch)
              return (
                <button key={ch.id} onClick={() => onSelect(ch.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-colors ${selected === ch.id ? 'bg-indigo-pale' : 'hover:bg-bg'}`}>
                  {isTeam ? (
                    <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center shrink-0"><Hash size={14} className="text-indigo-light" /></div>
                  ) : isGroup ? (
                    <div className="w-9 h-9 rounded-xl bg-indigo-pale flex items-center justify-center shrink-0"><Lock size={14} className="text-indigo" /></div>
                  ) : (
                    <Avatar firstName={firstName} lastName={lastName} id={ch.id} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-semibold truncate ${selected === ch.id ? 'text-indigo' : 'text-ink'}`}>{ch.name}</span>
                      {ch.lastMessage && <span className="text-[10px] text-faint shrink-0 ml-1">{formatTime(ch.lastMessage.createdAt)}</span>}
                    </div>
                    {ch.lastMessage && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted truncate">{ch.lastMessage.content}</p>
                        {(ch.unreadCount ?? 0) > 0 && <Badge count={ch.unreadCount!} />}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
        {sections.length === 0 && <p className="text-xs text-faint text-center py-8">Aucun résultat.</p>}
      </div>
    </div>
  )
}

/* ── Conversation view ── */
function ConvView({ channel, orgUsers, teams, onBack, onLeaveChannel }: {
  channel: Channel
  orgUsers: AppUser[]
  teams: Team[]
  onBack: () => void
  onLeaveChannel: (channelId: string) => void
}) {
  const { currentUser, currentOrg } = useAuth()
  const navigate = useNavigate()
  const type = channel.type as ConvType
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [promoteFile, setPromoteFile] = useState<Attachment | null>(null)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages on channel change
  useEffect(() => {
    setMessages([])
    setLocalAttachments([])
    MessageService.getMessages(channel.id, currentOrg.id).then(setMessages)
  }, [channel.id])

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = MessageService.subscribe(channel.id, currentOrg.id, msg => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
    })
    return unsubscribe
  }, [channel.id])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getUser = useCallback((id: string) => orgUsers.find(u => u.id === id), [orgUsers])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    setUploading(true)
    const { path, url, error } = await MessageService.uploadAttachment(currentOrg.id, channel.id, f)
    setUploading(false)
    if (error || !path) return
    const att: Attachment = { id: `a${Date.now()}`, name: f.name, size: f.size, type: f.type || 'application/octet-stream', url: url ?? undefined }
    setLocalAttachments(prev => [...prev, att])
    // Store the storage path in files[] so recipients can decrypt; display name in content
    await MessageService.send(channel.id, currentUser.id, `📎 ${f.name}`, currentOrg.id, [path])
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    // Optimistic: add locally (Realtime will confirm)
    await MessageService.send(channel.id, currentUser.id, trimmed, currentOrg.id)
  }

  async function handleLeave() {
    await MessageService.leaveConversation(channel.id, currentUser.id)
    onLeaveChannel(channel.id)
  }

  if (showInfo) {
    return (
      <InfoPanel
        channel={channel}
        orgUsers={orgUsers}
        teams={teams}
        attachments={localAttachments}
        onClose={() => setShowInfo(false)}
        onNavigateToDocs={() => navigate('/app/documents')}
        onLeave={handleLeave}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-lg text-muted hover:text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {type === 'team' && <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center shrink-0"><Hash size={14} className="text-indigo-light" /></div>}
        {type === 'group' && <div className="w-8 h-8 rounded-xl bg-indigo-pale flex items-center justify-center shrink-0"><Lock size={14} className="text-indigo" /></div>}
        {type === 'direct' && (() => { const p = channel.name.split(' '); return <Avatar firstName={p[0]} lastName={p[1] ?? ''} id={channel.id} size="sm" /> })()}

        <button className="flex-1 min-w-0 text-left" onClick={() => setShowInfo(true)}>
          <div className="font-semibold text-ink text-sm hover:text-indigo transition-colors">{channel.name}</div>
          <div className="text-[10px] text-muted">
            {type === 'direct' && 'Conversation privée'}
            {type === 'group' && `Groupe · ${channel.members.length} membres`}
            {type === 'team' && `Espace d'équipe · ${channel.members.length} membres`}
          </div>
        </button>

        <div className="flex items-center gap-1">
          {localAttachments.length > 0 && (
            <button onClick={() => setShowAttachments(!showAttachments)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${showAttachments ? 'bg-indigo text-white' : 'bg-bg border border-border text-muted hover:text-ink'}`}>
              <Paperclip size={13} />{localAttachments.length}
            </button>
          )}
          <button onClick={() => setShowInfo(true)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors">
            <Info size={17} />
          </button>
        </div>
      </div>

      {/* Attachments panel */}
      {showAttachments && (
        <div className="bg-bg border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Pièces jointes</p>
            <p className="text-[10px] text-faint">Fichiers privés à cette conversation</p>
          </div>
          <div className="flex flex-col gap-2">
            {localAttachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-2.5 bg-surface rounded-xl border border-border">
                <div className="w-7 h-7 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                  <Paperclip size={13} className="text-indigo" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ink truncate">{att.name}</div>
                  <div className="text-[10px] text-muted">{formatFileSize(att.size)}</div>
                </div>
                <button onClick={() => setPromoteFile(att)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo border border-indigo/20 rounded-lg hover:bg-indigo-pale transition-colors shrink-0">
                  <FolderInput size={11} /> Ajouter aux documents
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-indigo-pale flex items-center justify-center mb-3">
              {type === 'team' ? <Hash size={22} className="text-indigo" /> : type === 'group' ? <Lock size={22} className="text-indigo" /> : <User size={22} className="text-indigo" />}
            </div>
            <p className="text-sm font-semibold text-ink mb-1">Début de la conversation</p>
            <p className="text-xs text-muted">Envoyez le premier message.</p>
          </div>
        )}
        {messages.map(msg => {
          const user = getUser(msg.senderId)
          const isMe = msg.senderId === currentUser.id
          const isFileMsg = msg.files && msg.files.length > 0
          return (
            <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && user && <Avatar firstName={user.firstName} lastName={user.lastName} id={user.id} size="sm" />}
              <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && user && <span className="text-[11px] font-semibold text-muted ml-1">{user.firstName} {user.lastName}</span>}
                {isFileMsg ? (
                  <button
                    type="button"
                    onClick={() => {
                      const storagePath = msg.files![0]
                      const fileName = msg.content.replace('📎 ', '') || storagePath.split('/').pop() || 'fichier'
                      MessageService.downloadAndDecrypt(storagePath, msg.channelId, currentOrg.id, fileName)
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-sm ${isMe ? 'bg-indigo/10 border-indigo/20 text-indigo rounded-br-md' : 'bg-surface border-border text-ink rounded-bl-md'} hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    {fileIcon(msg.files![0])}
                    <span className="truncate max-w-[160px] font-medium">{msg.content.replace('📎 ', '')}</span>
                  </button>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-indigo text-white rounded-br-md' : 'bg-surface border border-border text-ink rounded-bl-md'}`}>
                    {msg.content}
                  </div>
                )}
                <span className="text-[10px] text-faint mx-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-3 border-t border-border bg-surface shrink-0">
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="p-2.5 rounded-xl text-muted hover:text-indigo hover:bg-indigo-pale transition-colors shrink-0 disabled:opacity-40">
            {uploading ? <Loader2 size={18} className="animate-spin text-indigo" /> : <Paperclip size={18} />}
          </button>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && text.trim()) { e.preventDefault(); handleSend() } }}
            placeholder={`Message ${channel.name.split(' ')[0]}…`}
            className="flex-1 px-4 py-3 bg-bg border border-border rounded-full text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent" />
          <button onClick={handleSend} disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-indigo flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {promoteFile && <PromoteModal file={promoteFile} onClose={() => setPromoteFile(null)} />}
    </div>
  )
}

/* ── Main ── */
export function Messages() {
  const { currentUser, currentOrg } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [orgUsers, setOrgUsers] = useState<AppUser[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)

  function loadChannels() {
    MessageService.getConversations(currentOrg.id, currentUser.id).then(setChannels)
  }

  function handleLeaveChannel(channelId: string) {
    setChannels(prev => prev.filter(c => c.id !== channelId))
    setSelected(null)
  }

  useEffect(() => {
    loadChannels()
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
    TeamService.getByOrganizationWithMembers(currentOrg.id).then(setTeams)
  }, [currentOrg.id, currentUser.id])

  const selectedChannel = channels.find(c => c.id === selected) ?? null

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`${selected ? 'hidden md:flex' : 'flex'} md:w-80 w-full flex-col border-r border-border bg-surface shrink-0 overflow-hidden`}>
        <ConvList
          channels={channels}
          onSelect={setSelected}
          selected={selected}
          onNewGroup={() => setShowNewGroup(true)}
        />
      </div>
      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden bg-bg`}>
        {selectedChannel ? (
          <ConvView
            channel={selectedChannel}
            orgUsers={orgUsers}
            teams={teams}
            onBack={() => setSelected(null)}
            onLeaveChannel={handleLeaveChannel}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-pale flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-indigo">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-ink mb-3">Sélectionnez une conversation</h3>
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { icon: User, label: 'Directs', desc: 'Conversations privées 1:1' },
                { icon: Lock, label: 'Groupes', desc: 'Discussions privées entre collègues' },
                { icon: Hash, label: 'Équipes', desc: 'Espaces organisationnels' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2 text-left">
                  <Icon size={14} className="text-indigo shrink-0" />
                  <span className="text-xs text-muted"><span className="font-semibold text-ink">{label}</span> — {desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          orgUsers={orgUsers}
          onCreated={loadChannels}
        />
      )}
    </div>
  )
}
