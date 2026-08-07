import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, CheckCircle2, Circle, PauseCircle, Trash2, X, Calendar, ChevronDown, Loader2, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { TaskService } from '../../services/task.service'
import { UserService } from '../../services/user.service'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import type { Task, User } from '../../lib/types'

type Status = Task['status']
type Filter = 'all' | Status

type Member = Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>

const STATUS_ORDER: Status[] = ['todo', 'in_progress', 'waiting', 'done']

function StatusIcon({ status, size = 18 }: { status: Status; size?: number }) {
  if (status === 'done')        return <CheckCircle2 size={size} className="text-success" />
  if (status === 'in_progress') return <div className="rounded-full border-2 border-indigo flex items-center justify-center" style={{ width: size, height: size }}><div className="w-2 h-2 rounded-full bg-indigo" /></div>
  if (status === 'waiting')     return <PauseCircle size={size} className="text-amber" />
  return <Circle size={size} className="text-faint" />
}


function isOverdue(dueDate: string | null, status: Status) {
  if (!dueDate || status === 'done') return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function TaskModal({
  task, members, currentUserId, orgId, onClose, onSaved,
}: {
  task: Task | null
  members: Member[]
  currentUserId: string
  orgId: string
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [title, setTitle]           = useState(task?.title ?? '')
  const [assigneeId, setAssigneeId] = useState<string | null>(task?.assigneeId ?? null)
  const [dueDate, setDueDate]       = useState(task?.dueDate ?? '')
  const [status, setStatus]         = useState<Status>(task?.status ?? 'todo')
  const [loading, setLoading]       = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 80) }, [])

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    if (task) {
      await TaskService.update(task.id, { title, assigneeId, dueDate: dueDate || null, status })
    } else {
      await TaskService.create(orgId, { title, assigneeId, dueDate: dueDate || null, status })
    }
    setLoading(false)
    onSaved()
  }

  async function handleDelete() {
    if (!task) return
    setDeleting(true)
    await TaskService.remove(task.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl p-6 pb-safe">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-navy">{task ? t('tasks.editTask') : t('tasks.newTask')}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-bg text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('tasks.titleLabel')} *</label>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder={t('tasks.titlePlaceholder')}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('tasks.status')}</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_ORDER.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    status === s
                      ? s === 'done'        ? 'bg-success text-white border-success'
                      : s === 'in_progress' ? 'bg-indigo text-white border-indigo'
                      : s === 'waiting'     ? 'bg-amber text-white border-amber'
                      :                       'bg-navy text-white border-navy'
                      : 'bg-bg border-border text-muted hover:border-navy/30'
                  }`}
                >
                  <StatusIcon status={s} size={12} />
                  {t(`tasks.${s === 'in_progress' ? 'inProgress' : s === 'todo' ? 'todo' : s === 'waiting' ? 'waiting' : 'done'}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Assigné */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('tasks.assignee')}</label>
            <div className="relative">
              <select
                value={assigneeId ?? ''}
                onChange={e => setAssigneeId(e.target.value || null)}
                className="w-full appearance-none px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-indigo pr-10"
              >
                <option value="">{t('tasks.assigneeNone')}</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}{m.id === currentUserId ? ` (${t('tasks.me')})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            </div>
          </div>

          {/* Échéance */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('tasks.dueDate')}</label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-indigo"
              />
              {dueDate && (
                <button type="button" onClick={() => setDueDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          {task && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 rounded-xl transition-colors"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {t('tasks.delete')}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || loading}
            className="flex-1 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {task ? t('tasks.save') : t('tasks.create')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export function Tasks() {
  const { t } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const [tasks, setTasks]     = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [filter, setFilter]   = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'new' | Task | null>(null)

  const orgId = currentOrg?.id ?? ''

  async function load() {
    if (!orgId) return
    const { tasks: t2 } = await TaskService.list(orgId)
    setTasks(t2)
    setLoading(false)
  }

  useEffect(() => {
    if (!orgId) return
    load()

    // Fetch org members for assignee dropdown
    UserService.getByOrganizationWithRole(orgId).then(users => {
      setMembers(users.filter(u => u.status === 'active'))
    })

    // Realtime
    const ch = supabase.channel(`tasks-${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `org_id=eq.${orgId}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [orgId])

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',        label: t('tasks.filterAll') },
    { key: 'todo',       label: t('tasks.todo') },
    { key: 'in_progress',label: t('tasks.inProgress') },
    { key: 'waiting',    label: t('tasks.waiting') },
    { key: 'done',       label: t('tasks.done') },
  ]

  const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  async function cycleStatus(task: Task) {
    const next: Record<Status, Status> = { todo: 'in_progress', in_progress: 'done', done: 'todo', waiting: 'todo' }
    await TaskService.update(task.id, { status: next[task.status] })
    load()
  }

  if (!currentUser) return null

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 pt-5 pb-3 bg-surface border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-navy">{t('tasks.title')}</h1>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('tasks.newTask')}</span>
          </button>
        </div>

        {/* Filtres */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-navy text-white'
                  : 'text-muted hover:text-ink hover:bg-bg'
              }`}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {tasks.filter(t => t.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={22} className="animate-spin text-muted" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
            <CheckCircle2 size={32} className="text-border" />
            <p className="text-sm text-muted">{filter === 'all' ? t('tasks.empty') : t('tasks.emptyFilter')}</p>
            {filter === 'all' && (
              <button onClick={() => setModal('new')} className="text-sm text-indigo font-medium hover:underline mt-1">
                {t('tasks.newTask')}
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map(task => {
              const overdue = isOverdue(task.dueDate, task.status)
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-surface/50 transition-colors cursor-pointer group"
                  onClick={() => setModal(task)}
                >
                  {/* Status toggle */}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); cycleStatus(task) }}
                    className="shrink-0 p-1 rounded-lg hover:bg-bg transition-colors"
                  >
                    <StatusIcon status={task.status} size={20} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted' : 'text-ink'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-danger' : 'text-faint'}`}>
                          <Calendar size={11} />
                          {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {overdue && <span className="font-medium"> · {t('tasks.overdue')}</span>}
                        </span>
                      )}
                      {task.status === 'waiting' && (
                        <span className="flex items-center gap-1 text-xs text-amber">
                          <Clock size={11} />
                          {t('tasks.waiting')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="shrink-0 flex items-center gap-2">
                    {task.assignee ? (
                      <Avatar
                        src={task.assignee.avatarUrl ?? undefined}
                        firstName={task.assignee.firstName}
                        lastName={task.assignee.lastName}
                        size="sm"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                        <span className="text-[9px] text-faint">—</span>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => setModal('new')}
        className="sm:hidden fixed bottom-24 right-5 w-14 h-14 bg-navy text-white rounded-full shadow-xl shadow-navy/30 flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modal !== null && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          members={members}
          currentUserId={currentUser.id}
          orgId={orgId}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
