import { useState, useEffect } from 'react'
import { Plus, Building2, Users, Pencil, Trash2, MoreHorizontal, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../../components/ui/Avatar'
import { DepartmentService } from '../../services/department.service'
import { UserService } from '../../services/user.service'
import { useAuth } from '../../contexts/AuthContext'
import type { Department, User } from '../../lib/types'

function DeptModal({ dept, onClose, onSave }: {
  dept?: Department | null
  onClose: () => void
  onSave: (d: { name: string; code: string }) => Promise<string | null>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(dept?.name ?? '')
  const [code, setCode] = useState(dept?.code ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError(null)
    const err = await onSave({ name: name.trim(), code: code.trim() })
    setLoading(false)
    if (!err) { onClose(); return }
    setError(err)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-navy text-lg">{dept ? t('admin.deptEditTitle') : t('admin.newDept')}</h3>
          <button onClick={onClose} disabled={loading} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg disabled:opacity-40"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('admin.deptNameLabel')} *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Marketing"
              autoFocus
              disabled={loading}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('admin.deptCodeLabel')} *</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="MKT"
              disabled={loading}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo disabled:opacity-50"
            />
          </div>
          {error && (
            <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg disabled:opacity-40">{t('common.cancel')}</button>
          <button
            disabled={!name.trim() || !code.trim() || loading}
            onClick={handleSave}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {dept ? t('common.save') : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminDepartments() {
  const { t } = useTranslation()
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

  async function create(data: { name: string; code: string }): Promise<string | null> {
    const { dept, error } = await DepartmentService.create(currentOrg.id, data)
    if (error || !dept) return error ?? t('admin.deptCreateError')
    setDepts(prev => [...prev, dept])
    return null
  }

  async function update(id: string, data: { name: string; code: string }): Promise<string | null> {
    const { error } = await DepartmentService.update(id, data)
    if (error) return error
    setDepts(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
    return null
  }

  async function remove(id: string) {
    const dept = depts.find(d => d.id === id)
    const confirmed = window.confirm(t('admin.deptDeleteConfirm', { name: dept?.name ?? id }))
    if (!confirmed) return
    await DepartmentService.delete(id)
    setDepts(prev => prev.filter(d => d.id !== id))
    setMenuOpen(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{t('admin.deptTitle')}</h1>
          <p className="text-sm text-muted mt-0.5">{t(depts.length !== 1 ? 'admin.deptCountPlural' : 'admin.deptCount', { count: depts.length })}</p>
        </div>
        <button
          onClick={() => { setEditDept(null); setShowModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t('admin.newDept')}</span>
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
                        <Pencil size={14} /> {t('common.edit')}
                      </button>
                      <button onClick={() => remove(dept.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-bg border-t border-border">
                        <Trash2 size={14} /> {t('common.delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted mb-3">
                <Users size={13} />
                <span>{t(count !== 1 ? 'admin.memberCountPlural' : 'admin.memberCount', { count })}</span>
              </div>

              {members.length > 0 && (
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map(m => (
                    <Avatar key={m.id} firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" src={m.avatarUrl} />
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
          <span className="text-sm text-muted">{t('admin.newDept')}</span>
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
