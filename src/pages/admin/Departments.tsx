import { useState, useEffect } from 'react'
import { Plus, Building2, Users, Pencil, Trash2, MoreHorizontal, X } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { DepartmentService } from '../../services/department.service'
import { UserService } from '../../services/user.service'
import { useAuth } from '../../contexts/AuthContext'
import type { Department, User } from '../../lib/types'

function DeptModal({ dept, onClose, onSave }: {
  dept?: Department | null
  onClose: () => void
  onSave: (d: { name: string; code: string }) => void
}) {
  const [name, setName] = useState(dept?.name ?? '')
  const [code, setCode] = useState(dept?.code ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-navy text-lg">{dept ? 'Modifier' : 'Nouveau département'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Nom *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Marketing"
              autoFocus
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Code court *</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="MKT"
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
          <button
            disabled={!name.trim() || !code.trim()}
            onClick={() => { onSave({ name: name.trim(), code: code.trim() }); onClose() }}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {dept ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminDepartments() {
  const { currentOrg } = useAuth()
  const [depts, setDepts] = useState<Department[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    DepartmentService.list(currentOrg.id).then(setDepts)
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
  }, [currentOrg.id])

  function memberCount(name: string) {
    return orgUsers.filter(u => u.department === name).length
  }

  function membersOf(name: string) {
    return orgUsers.filter(u => u.department === name)
  }

  async function create(data: { name: string; code: string }) {
    const { dept } = await DepartmentService.create(currentOrg.id, data)
    if (dept) setDepts(prev => [...prev, dept])
  }

  async function update(id: string, data: { name: string; code: string }) {
    await DepartmentService.update(id, data)
    setDepts(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
  }

  async function remove(id: string) {
    const dept = depts.find(d => d.id === id)
    const confirmed = window.confirm(`Supprimer le département "${dept?.name ?? id}" ? Cette action est irréversible.`)
    if (!confirmed) return
    await DepartmentService.delete(id)
    setDepts(prev => prev.filter(d => d.id !== id))
    setMenuOpen(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Départements</h1>
          <p className="text-sm text-muted mt-0.5">{depts.length} département{depts.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditDept(null); setShowModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {depts.map(dept => {
          const count = memberCount(dept.name)
          const members = membersOf(dept.name)
          return (
            <div key={dept.id} className="bg-surface rounded-xl border border-border p-5 hover:border-indigo/20 hover:shadow-sm transition-all relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center">
                    <Building2 size={18} className="text-indigo" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">{dept.name}</h3>
                    <span className="text-xs text-muted font-mono">{dept.code}</span>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setMenuOpen(menuOpen === dept.id ? null : dept.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === dept.id && (
                    <div className="absolute right-0 top-8 z-20 w-36 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                      <button onClick={() => { setEditDept(dept); setShowModal(true); setMenuOpen(null) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-bg text-ink">
                        <Pencil size={14} /> Modifier
                      </button>
                      <button onClick={() => remove(dept.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-bg border-t border-border">
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted mb-3">
                <Users size={13} />
                <span>{count} membre{count !== 1 ? 's' : ''}</span>
              </div>

              {members.length > 0 && (
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
              )}
            </div>
          )
        })}

        <button
          onClick={() => { setEditDept(null); setShowModal(true) }}
          className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-indigo/40 transition-colors text-center h-[140px]"
        >
          <Plus size={22} className="text-faint" />
          <span className="text-sm text-muted">Nouveau département</span>
        </button>
      </div>

      {showModal && (
        <DeptModal
          dept={editDept}
          onClose={() => setShowModal(false)}
          onSave={data => editDept ? update(editDept.id, data) : create(data)}
        />
      )}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
