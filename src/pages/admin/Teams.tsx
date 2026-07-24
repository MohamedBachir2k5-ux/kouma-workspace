import { useState, useRef, useEffect } from 'react'
import { Plus, Hash, Users, MoreHorizontal, Pencil, Trash2, X, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { TeamService } from '../../services/team.service'
import { UserService } from '../../services/user.service'
import { Avatar } from '../../components/ui/Avatar'
import type { Team, User } from '../../lib/types'

const TEAM_COLORS = ['#0f1628', '#4f46e5', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9']

function ResponsableSearch({ value, onChange, users }: {
  value: string
  onChange: (id: string) => void
  users: User[]
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = users.find(u => u.id === value)
  const results = query.length > 0
    ? users.filter(u => u.status === 'active' && (
        `${u.firstName} ${u.lastName} ${u.role}`.toLowerCase().includes(query.toLowerCase())
      ))
    : []

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function select(id: string) { onChange(id); setQuery(''); setOpen(false) }
  function clear() { onChange(''); setQuery('') }

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-bg border border-indigo rounded-xl">
          <Avatar firstName={selected.firstName} lastName={selected.lastName} id={selected.id} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink">{selected.firstName} {selected.lastName}</div>
            <div className="text-xs text-muted">{selected.role}</div>
          </div>
          <button type="button" onClick={clear} className="text-muted hover:text-ink">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Rechercher par nom ou fonction…"
            className="w-full pl-9 pr-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
          />
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {results.map(u => (
            <button key={u.id} type="button" onClick={() => select(u.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors text-left">
              <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">{u.firstName} {u.lastName}</div>
                <div className="text-xs text-muted">{u.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamModal({ team, users, onClose, onSave }: {
  team?: Team | null
  users: User[]
  onClose: () => void
  onSave: (data: Partial<Team>) => void
}) {
  const [form, setForm] = useState({
    name: team?.name ?? '',
    description: team?.description ?? '',
    responsableId: team?.responsableId ?? '',
    color: team?.color ?? TEAM_COLORS[0],
  })

  function update(field: string, val: string) { setForm(p => ({ ...p, [field]: val })) }

  const isEdit = !!team
  const canSubmit = form.name.trim() && form.responsableId

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-navy text-lg">{isEdit ? "Modifier l'équipe" : 'Nouvelle équipe'}</h3>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Nom *</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Finance" autoFocus
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Rôle et périmètre de cette équipe…" rows={2}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Couleur</label>
            <div className="flex gap-2.5">
              {TEAM_COLORS.map(c => (
                <button key={c} type="button" onClick={() => update('color', c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.color === c ? c : 'transparent', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Responsable *</label>
            <ResponsableSearch value={form.responsableId} onChange={id => update('responsableId', id)} users={users} />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
          <button
            disabled={!canSubmit}
            onClick={() => { onSave(form); onClose() }}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {isEdit ? 'Enregistrer' : "Créer l'équipe"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminTeams() {
  const { currentOrg, currentUser } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    TeamService.getByOrganizationWithMembers(currentOrg.id).then(setTeams)
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
  }, [currentOrg.id])

  async function createTeam(data: Partial<Team>) {
    const { teamId, error } = await TeamService.create({
      organizationId: currentOrg.id,
      name: data.name ?? '',
      description: data.description,
      color: data.color ?? TEAM_COLORS[0],
      ownerId: data.responsableId ?? currentUser.id,
      actorId: currentUser.id,
    })
    if (!error && teamId) {
      const updated = await TeamService.getByOrganizationWithMembers(currentOrg.id)
      setTeams(updated)
    }
  }

  async function updateTeam(id: string, data: Partial<Team>) {
    await TeamService.update(
      id,
      { name: data.name, description: data.description ?? null, color: data.color, owner_id: data.responsableId },
      currentOrg.id,
      currentUser.id,
    )
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
  }

  async function deleteTeam(id: string) {
    await TeamService.delete(id, currentOrg.id, currentUser.id)
    setTeams(prev => prev.filter(t => t.id !== id))
    setMenuOpen(null)
  }

  function getUser(id: string) { return orgUsers.find(u => u.id === id) }

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Équipes</h1>
          <p className="text-sm text-muted mt-0.5">{teams.length} équipe{teams.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditTeam(null); setShowModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90">
          <Plus size={16} /> <span className="hidden sm:inline">Nouvelle équipe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => {
          const responsable = getUser(team.responsableId)
          const members = team.members.map(id => getUser(id)).filter(Boolean) as User[]

          return (
            <div key={team.id} className="bg-surface rounded-xl border border-border p-5 hover:border-indigo/20 hover:shadow-sm transition-all relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: team.color + '20' }}>
                    <Hash size={18} style={{ color: team.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">{team.name}</h3>
                    {team.description && <p className="text-xs text-muted line-clamp-1 mt-0.5">{team.description}</p>}
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setMenuOpen(menuOpen === team.id ? null : team.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === team.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                      <button onClick={() => { setEditTeam(team); setShowModal(true); setMenuOpen(null) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-bg text-ink">
                        <Pencil size={14} /> Modifier
                      </button>
                      <button onClick={() => deleteTeam(team.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-bg border-t border-border">
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {responsable && (
                <div className="flex items-center gap-2 mb-3 text-xs text-muted">
                  <Avatar firstName={responsable.firstName} lastName={responsable.lastName} id={responsable.id} size="sm" />
                  <span>Responsable : <span className="font-medium text-ink">{responsable.firstName} {responsable.lastName}</span></span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map(m => (
                    <Avatar key={m.id} firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" />
                  ))}
                  {members.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-[10px] font-bold text-muted border-2 border-surface">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Users size={13} />
                  {members.length} membre{members.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )
        })}

        <button onClick={() => { setEditTeam(null); setShowModal(true) }}
          className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-indigo/40 transition-colors min-h-[140px]">
          <Plus size={22} className="text-faint" />
          <span className="text-sm text-muted">Nouvelle équipe</span>
        </button>
      </div>

      {showModal && (
        <TeamModal
          team={editTeam}
          users={orgUsers}
          onClose={() => setShowModal(false)}
          onSave={data => editTeam ? updateTeam(editTeam.id, data) : createTeam(data)}
        />
      )}

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
