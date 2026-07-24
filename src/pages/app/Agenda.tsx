import { useState, useRef, useEffect } from 'react'
import { Plus, Clock, Users, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Calendar, Search, X, MapPin, Link as LinkIcon } from 'lucide-react'
import { EventService } from '../../services/event.service'
import { UserService } from '../../services/user.service'
import { TeamService } from '../../services/team.service'
import { MessageService } from '../../services/message.service'
import { useAuth } from '../../contexts/AuthContext'
import { formatEventTime } from '../../lib/utils'
import { Avatar } from '../../components/ui/Avatar'
import type { EventStatus, Event, User, Team, Channel } from '../../lib/types'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

const STATUS_CONFIG: Record<EventStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  scheduled: { label: 'Planifié',  icon: Calendar,      className: 'bg-indigo/10 text-indigo' },
  modified:  { label: 'Modifié',   icon: AlertTriangle,  className: 'bg-amber/10 text-amber' },
  cancelled: { label: 'Annulé',    icon: XCircle,        className: 'bg-danger/10 text-danger' },
  done:      { label: 'Terminé',   icon: CheckCircle2,   className: 'bg-success/10 text-success' },
}

function StatusBadge({ status }: { status: EventStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.className}`}>
      <Icon size={10} />{cfg.label}
    </span>
  )
}

/* ── Smart participant picker ── */
function ParticipantPicker({ participants, onChange, orgUsers, myTeams, myGroups }: {
  participants: string[]
  onChange: (ids: string[]) => void
  orgUsers: User[]
  myTeams: Team[]
  myGroups: Channel[]
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const searchResults = query.length > 0
    ? orgUsers.filter(u => u.status === 'active' && `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.toLowerCase()))
    : []

  function add(id: string) { if (!participants.includes(id)) onChange([...participants, id]) }
  function remove(id: string) { onChange(participants.filter(p => p !== id)) }

  function addTeam(teamId: string) {
    const team = myTeams.find(t => t.id === teamId)
    if (!team) return
    const toAdd = team.members.filter(id => !participants.includes(id))
    onChange([...participants, ...toAdd])
  }

  function addGroup(channelId: string) {
    const ch = myGroups.find(c => c.id === channelId)
    if (!ch) return
    const toAdd = ch.members.filter(id => !participants.includes(id))
    onChange([...participants, ...toAdd])
  }

  return (
    <div ref={ref}>
      {/* Chips */}
      {participants.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {participants.map(id => {
            const u = orgUsers.find(u => u.id === id)
            if (!u) return null
            return (
              <span key={id} className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 bg-indigo-pale rounded-full text-xs font-medium text-indigo">
                <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" />
                {u.firstName}
                <button type="button" onClick={() => remove(id)} className="ml-0.5 text-indigo/50 hover:text-indigo">
                  <X size={10} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un participant par nom…"
          className="w-full pl-9 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
        />
        {open && searchResults.length > 0 && (
          <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
            {searchResults.map(u => (
              <button key={u.id} type="button"
                onClick={() => { add(u.id); setQuery(''); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg transition-colors ${participants.includes(u.id) ? 'opacity-50 cursor-default' : ''}`}>
                <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-muted">{u.role}</div>
                </div>
                {participants.includes(u.id) && <CheckCircle2 size={14} className="text-indigo shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick-add by team */}
      {myTeams.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-faint uppercase tracking-wider mb-1.5">Ajouter une équipe</p>
          <div className="flex flex-wrap gap-1.5">
            {myTeams.map(t => (
              <button key={t.id} type="button" onClick={() => addTeam(t.id)}
                className="flex items-center gap-1 px-2.5 py-1 bg-bg border border-border rounded-lg text-xs text-muted hover:border-indigo/40 hover:text-ink transition-colors">
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add by group */}
      {myGroups.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-faint uppercase tracking-wider mb-1.5">Ajouter un groupe</p>
          <div className="flex flex-wrap gap-1.5">
            {myGroups.map(g => (
              <button key={g.id} type="button" onClick={() => addGroup(g.id)}
                className="px-2.5 py-1 bg-bg border border-border rounded-lg text-xs text-muted hover:border-indigo/40 hover:text-ink transition-colors">
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Event creation / edit form ── */
interface EventForm {
  title: string
  date: string
  timeStart: string
  timeEnd: string
  location: string
  externalLink: string
  participants: string[]
  description: string
}

function emptyForm(): EventForm {
  const today = new Date().toISOString().split('T')[0]
  return { title: '', date: today, timeStart: '09:00', timeEnd: '10:00', location: '', externalLink: '', participants: [], description: '' }
}

function EventModal({ event, orgUsers, myTeams, myGroups, onClose, onSave }: {
  event?: Event | null
  orgUsers: User[]
  myTeams: Team[]
  myGroups: Channel[]
  onClose: () => void
  onSave: (form: EventForm) => void
}) {
  const [form, setForm] = useState<EventForm>(() => {
    if (!event) return emptyForm()
    const start = new Date(event.startAt)
    const end = new Date(event.endAt)
    return {
      title: event.title,
      date: start.toISOString().split('T')[0],
      timeStart: `${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}`,
      timeEnd: `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`,
      location: '',
      externalLink: '',
      participants: event.participants,
      description: event.description ?? '',
    }
  })

  function set(field: keyof EventForm, val: string | string[]) {
    setForm(p => ({ ...p, [field]: val }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-navy text-base">{event ? 'Modifier la réunion' : 'Nouvelle réunion'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Titre *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Réunion budget" autoFocus
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Début *</label>
              <input type="time" value={form.timeStart} onChange={e => set('timeStart', e.target.value)}
                className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Fin *</label>
              <input type="time" value={form.timeEnd} onChange={e => set('timeEnd', e.target.value)}
                className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Lieu</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Salle de réunion, adresse…"
                className="w-full pl-9 pr-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Lien de réunion</label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input value={form.externalLink} onChange={e => set('externalLink', e.target.value)}
                placeholder="https://meet.example.com/… (Teams, Zoom…)"
                className="w-full pl-9 pr-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
            {form.externalLink && (
              <a href={form.externalLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo hover:underline">
                <LinkIcon size={11} /> Ouvrir le lien
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
              Participants ({form.participants.length})
            </label>
            <ParticipantPicker
              participants={form.participants}
              onChange={ids => set('participants', ids)}
              orgUsers={orgUsers}
              myTeams={myTeams}
              myGroups={myGroups}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder="Ordre du jour, contexte…"
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
          <button
            disabled={!form.title.trim() || !form.date}
            onClick={() => { onSave(form); onClose() }}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {event ? 'Enregistrer' : 'Créer la réunion'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Agenda() {
  const { currentUser, currentOrg } = useAuth()
  const today = new Date()
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [showCreate, setShowCreate] = useState(false)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all')
  const [events, setEvents] = useState<Event[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [myGroups, setMyGroups] = useState<Channel[]>([])

  useEffect(() => {
    EventService.list(currentOrg.id).then(setEvents)
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
    TeamService.getByOrganizationWithMembers(currentOrg.id).then(all => {
      setMyTeams(all.filter(t => t.members.includes(currentUser.id)))
    })
    MessageService.getConversations(currentOrg.id, currentUser.id).then(convs => {
      setMyGroups(convs.filter(c => c.type === 'group'))
    })
  }, [currentOrg.id, currentUser.id])

  const { year, month } = viewDate
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  function prevMonth() {
    setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
    setSelectedDay(null)
  }
  function nextMonth() {
    setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })
    setSelectedDay(null)
  }

  function hasEvent(day: number) {
    return events.some(e => {
      const d = new Date(e.startAt)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
  }

  const baseEvents = selectedDay
    ? events.filter(e => { const d = new Date(e.startAt); return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year })
    : events.filter(e => new Date(e.startAt) >= today).slice(0, 10)

  const selectedEvents = baseEvents.filter(e => filterStatus === 'all' || e.status === filterStatus)

  function getParticipant(id: string) { return orgUsers.find(u => u.id === id) }

  async function createEvent(form: EventForm) {
    const startAt = new Date(`${form.date}T${form.timeStart}:00`).toISOString()
    const endAt = new Date(`${form.date}T${form.timeEnd}:00`).toISOString()
    const event = await EventService.create({
      organizationId: currentOrg.id,
      title: form.title,
      description: form.description || undefined,
      startAt, endAt,
      participants: form.participants.length > 0 ? form.participants : [currentUser.id],
      createdById: currentUser.id,
      status: 'scheduled',
    })
    setEvents(prev => [...prev, event])
  }

  async function updateEvent(id: string, form: EventForm) {
    const startAt = new Date(`${form.date}T${form.timeStart}:00`).toISOString()
    const endAt = new Date(`${form.date}T${form.timeEnd}:00`).toISOString()
    const patch = { title: form.title, description: form.description || undefined, startAt, endAt, participants: form.participants, status: 'modified' as EventStatus, modifiedAt: new Date().toISOString() }
    await EventService.update(id, patch)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  async function cancelEvent(id: string) {
    await EventService.cancel(id, "Annulé par l'organisateur.")
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' as EventStatus, cancelReason: "Annulé par l'organisateur." } : e))
  }

  async function markDone(id: string) {
    await EventService.markDone(id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'done' as EventStatus } : e))
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-ink">Agenda</h2>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={14} />
            <span className="hidden sm:inline">Nouvelle réunion</span>
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-bg transition-colors text-muted hover:text-ink">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-semibold text-ink text-sm">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-bg transition-colors text-muted hover:text-ink">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-faint py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isSelected = selectedDay === day
              const has = hasEvent(day)
              return (
                <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative mx-auto flex flex-col items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                    isSelected ? 'bg-indigo text-white' : isToday ? 'bg-navy text-white' : 'text-ink hover:bg-bg'
                  }`}>
                  {day}
                  {has && !isSelected && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-indigo'}`} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {([['all','Tous'],['scheduled','Planifiés'],['modified','Modifiés'],['cancelled','Annulés'],['done','Terminés']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilterStatus(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === id ? 'bg-navy text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
              }`}>{label}</button>
          ))}
        </div>

        {/* Events list */}
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            {selectedDay ? `${selectedDay} ${MONTHS[month]}${selectedEvents.length === 0 ? ' — aucun événement' : ''}` : 'Prochains événements'}
          </h3>

          <div className="space-y-3">
            {selectedEvents.map(event => {
              const start = new Date(event.startAt)
              const isDisabled = event.status === 'cancelled' || event.status === 'done'

              return (
                <div key={event.id} className={`bg-surface rounded-xl border p-4 transition-colors ${isDisabled ? 'border-border opacity-70' : 'border-border hover:border-indigo/30'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 shrink-0 text-center">
                      <div className="text-xs text-muted font-medium">{MONTHS[start.getMonth()].slice(0,3)}</div>
                      <div className={`text-lg font-bold leading-tight ${isDisabled ? 'text-muted' : 'text-navy'}`}>{start.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`font-semibold text-sm ${isDisabled ? 'text-muted line-through' : 'text-ink'}`}>{event.title}</h4>
                        <StatusBadge status={event.status} />
                      </div>

                      {event.status === 'cancelled' && event.cancelReason && (
                        <div className="flex items-start gap-1.5 mb-2 p-2 bg-danger/5 rounded-lg border border-danger/15">
                          <XCircle size={12} className="text-danger mt-0.5 shrink-0" />
                          <p className="text-xs text-danger">{event.cancelReason}</p>
                        </div>
                      )}
                      {event.status === 'modified' && event.description && (
                        <div className="flex items-start gap-1.5 mb-2 p-2 bg-amber/5 rounded-lg border border-amber/15">
                          <AlertTriangle size={12} className="text-amber mt-0.5 shrink-0" />
                          <p className="text-xs text-amber">{event.description}</p>
                        </div>
                      )}
                      {event.status !== 'cancelled' && event.status !== 'modified' && event.description && (
                        <p className="text-xs text-muted mb-2 leading-relaxed">{event.description}</p>
                      )}

                      <div className="flex flex-col gap-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Clock size={13} />
                          {formatEventTime(event.startAt)} – {formatEventTime(event.endAt)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Users size={13} />
                          <div className="flex -space-x-1.5">
                            {event.participants.slice(0,4).map(pid => {
                              const p = getParticipant(pid)
                              if (!p) return null
                              return <Avatar key={pid} firstName={p.firstName} lastName={p.lastName} id={p.id} size="sm" />
                            })}
                          </div>
                          <span>{event.participants.length} participant{event.participants.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {!isDisabled && (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setEditEvent(event)}
                            className="px-2.5 py-1 text-[11px] font-medium text-indigo border border-indigo/20 rounded-lg hover:bg-indigo-pale transition-colors">
                            Modifier
                          </button>
                          <button onClick={() => cancelEvent(event.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger/5 transition-colors">
                            Annuler
                          </button>
                          <button onClick={() => markDone(event.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-success border border-success/20 rounded-lg hover:bg-success/5 transition-colors">
                            Terminer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {selectedEvents.length === 0 && selectedDay && (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center mx-auto mb-3">
                  <Plus size={22} className="text-faint" />
                </div>
                <p className="text-sm text-muted mb-3">Aucune réunion ce jour.</p>
                <button onClick={() => setShowCreate(true)} className="text-sm text-indigo font-medium hover:underline">
                  Créer une réunion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showCreate || editEvent) && (
        <EventModal
          event={editEvent}
          orgUsers={orgUsers}
          myTeams={myTeams}
          myGroups={myGroups}
          onClose={() => { setShowCreate(false); setEditEvent(null) }}
          onSave={form => editEvent ? updateEvent(editEvent.id, form) : createEvent(form)}
        />
      )}
    </div>
  )
}
