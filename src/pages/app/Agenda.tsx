import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Clock, Users, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Calendar, Search, X, MapPin, Link as LinkIcon, ThumbsUp, ThumbsDown, ClipboardList } from 'lucide-react'
import { EventService } from '../../services/event.service'
import { UserService } from '../../services/user.service'
import { TeamService } from '../../services/team.service'
import { MessageService } from '../../services/message.service'
import { useAuth } from '../../contexts/AuthContext'
import { formatEventTime } from '../../lib/utils'
import { Avatar } from '../../components/ui/Avatar'
import { MeetingMinutesModal } from '../../components/ui/MeetingMinutesModal'
import { MeetingMinutesService } from '../../services/meeting-minutes.service'
import type { EventStatus, Event, User, Team, Channel, MeetingMinutes } from '../../lib/types'

const LANG_TO_LOCALE: Record<string, string> = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', pt: 'pt-BR' }
function calLocale() {
  const lang = localStorage.getItem('kouma_lang') ?? 'fr'
  return LANG_TO_LOCALE[lang] ?? 'fr-FR'
}
function getMonths(): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleDateString(calLocale(), { month: 'long' })
      .replace(/^./, c => c.toUpperCase())
  )
}
function getDays(): string[] {
  const locale = calLocale()
  // Jan 1 2024 = Monday; Jan 2 = Tue; ... Jan 7 = Sun → gives Mon-Sun order
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i + 1).toLocaleDateString(locale, { weekday: 'short' })
      .replace(/\.$/, '').slice(0, 3).replace(/^./, c => c.toUpperCase())
  )
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

type StatusKey = 'agenda.statusScheduled' | 'agenda.statusModified' | 'agenda.statusCancelled' | 'agenda.statusDone'

const STATUS_CONFIG: Record<EventStatus, { labelKey: StatusKey; icon: typeof CheckCircle2; className: string }> = {
  scheduled: { labelKey: 'agenda.statusScheduled', icon: Calendar,      className: 'bg-indigo/10 text-indigo' },
  modified:  { labelKey: 'agenda.statusModified',  icon: AlertTriangle,  className: 'bg-amber/10 text-amber' },
  cancelled: { labelKey: 'agenda.statusCancelled', icon: XCircle,        className: 'bg-danger/10 text-danger' },
  done:      { labelKey: 'agenda.statusDone',      icon: CheckCircle2,   className: 'bg-success/10 text-success' },
}

function StatusBadge({ status }: { status: EventStatus }) {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.className}`}>
      <Icon size={10} />{t(cfg.labelKey)}
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
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const searchResults = query.length > 0
    ? orgUsers.filter(u => u.status === 'active' && u.role === 'member' && `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.toLowerCase()))
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
                <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
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
          placeholder={t('agenda.searchParticipant')}
          className="w-full pl-9 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
        />
        {open && searchResults.length > 0 && (
          <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
            {searchResults.map(u => (
              <button key={u.id} type="button"
                onClick={() => { add(u.id); setQuery(''); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg transition-colors ${participants.includes(u.id) ? 'opacity-50 cursor-default' : ''}`}>
                <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-muted">{u.jobTitle ?? t('common.collaborator')}</div>
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
          <p className="text-[10px] font-semibold text-faint uppercase tracking-wider mb-1.5">{t('agenda.addTeam')}</p>
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
          <p className="text-[10px] font-semibold text-faint uppercase tracking-wider mb-1.5">{t('agenda.addGroup')}</p>
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

function EventModal({ event, prefill, orgUsers, myTeams, myGroups, onClose, onSave }: {
  event?: Event | null
  prefill?: Partial<EventForm>
  orgUsers: User[]
  myTeams: Team[]
  myGroups: Channel[]
  onClose: () => void
  onSave: (form: EventForm) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<EventForm>(() => {
    if (!event) return { ...emptyForm(), ...prefill }
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
          <h3 className="font-bold text-navy text-base">{event ? t('agenda.editMeeting') : t('agenda.newMeeting')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('agenda.meetingTitle')}</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder={t('agenda.newMeeting')} autoFocus
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('agenda.dateLabel')}</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('agenda.start')}</label>
              <input type="time" value={form.timeStart} onChange={e => set('timeStart', e.target.value)}
                className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('agenda.end')}</label>
              <input type="time" value={form.timeEnd} onChange={e => set('timeEnd', e.target.value)}
                className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('agenda.location')}</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder={t('agenda.location')}
                className="w-full pl-9 pr-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('agenda.meetingLink')}</label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input value={form.externalLink} onChange={e => set('externalLink', e.target.value)}
                placeholder="https://meet.example.com/… (Teams, Zoom…)"
                className="w-full pl-9 pr-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            </div>
            {form.externalLink && /^https?:\/\//i.test(form.externalLink) && (
              <a href={form.externalLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo hover:underline">
                <LinkIcon size={11} /> {t('agenda.openLink')}
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
              {t('agenda.participants')} ({form.participants.length})
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
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('agenda.description')}</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} placeholder={`${t('agenda.description')}…`}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button
            disabled={!form.title.trim() || !form.date}
            onClick={() => { onSave(form); onClose() }}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {event ? t('agenda.save') : t('agenda.newMeeting')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Agenda() {
  const { t, i18n } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const [searchParams] = useSearchParams()
  const today = new Date()
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [showCreate, setShowCreate] = useState(() => searchParams.has('participants') || searchParams.has('title'))
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [minutesEvent, setMinutesEvent] = useState<Event | null>(null)
  const [minutesMap, setMinutesMap] = useState<Record<string, MeetingMinutes>>({})
  const [pendingDoneId, setPendingDoneId] = useState<string | null>(null)
  const [rsvpToast, setRsvpToast] = useState<string | null>(null)

  // Recompute months/days when language changes
  const MONTHS = useMemo(() => getMonths(), [i18n.language])
  const DAYS = useMemo(() => getDays(), [i18n.language])

  // Pre-fill from navigation params (e.g. from Messages: ?participants=id1,id2&title=...)
  const createPrefill = useMemo<Partial<EventForm>>(() => {
    const raw = searchParams.get('participants')
    const title = searchParams.get('title') ?? ''
    return {
      participants: raw ? raw.split(',').filter(Boolean) : [],
      title,
    }
  }, [searchParams])
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all')
  const [filterScope, setFilterScope] = useState<'all' | 'mine'>('all')
  const [events, setEvents] = useState<Event[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [myGroups, setMyGroups] = useState<Channel[]>([])

  useEffect(() => {
    EventService.list(currentOrg.id).then(evts => {
      setEvents(evts)
      const doneIds = evts.filter(e => e.status === 'done').map(e => e.id)
      if (doneIds.length > 0) {
        Promise.all(doneIds.map(id => MeetingMinutesService.getByEvent(id))).then(results => {
          const map: Record<string, MeetingMinutes> = {}
          results.forEach((m, i) => { if (m) map[doneIds[i]] = m })
          setMinutesMap(map)
        })
      }
    })
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

  const scopedEvents = filterScope === 'mine'
    ? events.filter(e => e.participants.includes(currentUser.id) || e.createdById === currentUser.id)
    : events

  const baseEvents = selectedDay
    ? scopedEvents.filter(e => { const d = new Date(e.startAt); return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year })
    : scopedEvents.filter(e => new Date(e.startAt) >= today).slice(0, 10)

  const selectedEvents = baseEvents.filter(e => filterStatus === 'all' || e.status === filterStatus)

  function getParticipant(id: string) { return orgUsers.find(u => u.id === id) }

  async function createEvent(form: EventForm) {
    const startAt = new Date(`${form.date}T${form.timeStart}:00`).toISOString()
    const endAt = new Date(`${form.date}T${form.timeEnd}:00`).toISOString()
    if (hasConflict(startAt, endAt)) {
      if (!window.confirm(t('agenda.conflict'))) return
    }
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
    await EventService.update(id, patch, currentOrg.id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  async function cancelEvent(id: string) {
    await EventService.cancel(id, t('agenda.canceledBy'), currentOrg.id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' as EventStatus, cancelReason: t('agenda.canceledBy') } : e))
  }

  async function markDone(id: string) {
    const event = events.find(e => e.id === id)
    if (!event) return
    setPendingDoneId(id)
    setMinutesEvent(event)
  }

  async function confirmMarkDone(id: string) {
    await EventService.markDone(id, currentOrg.id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'done' as EventStatus } : e))
    setMinutesEvent(null)
    setPendingDoneId(null)
  }

  async function respondToEvent(id: string, response: 'accepted' | 'declined') {
    await EventService.respondToEvent(id, currentUser.id, response)
    setEvents(prev => prev.map(e => e.id === id
      ? { ...e, rsvp: { ...(e.rsvp ?? {}), [currentUser.id]: response } }
      : e
    ))
    const msg = t(response === 'accepted' ? 'agenda.rsvpAccepted' : 'agenda.rsvpDeclined')
    setRsvpToast(msg)
    setTimeout(() => setRsvpToast(null), 3000)
  }

  function hasConflict(startAt: string, endAt: string, excludeId?: string): boolean {
    const newStart = new Date(startAt).getTime()
    const newEnd = new Date(endAt).getTime()
    return events.some(e => {
      if (excludeId && e.id === excludeId) return false
      if (e.status === 'cancelled') return false
      if (!e.participants.includes(currentUser.id)) return false
      const s = new Date(e.startAt).getTime()
      const en = new Date(e.endAt).getTime()
      return newStart < en && newEnd > s
    })
  }

  const statusFilters: [EventStatus | 'all', string][] = [
    ['all', t('agenda.allStatus')],
    ['scheduled', t('agenda.statusScheduledPlural')],
    ['modified', t('agenda.statusModifiedPlural')],
    ['cancelled', t('agenda.statusCancelledPlural')],
    ['done', t('agenda.statusDonePlural')],
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-ink">{t('agenda.title')}</h2>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={14} />
            <span className="hidden sm:inline">{t('agenda.newMeeting')}</span>
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

        {/* Scope filter */}
        <div className="flex gap-2 mb-2">
          {(['all', 'mine'] as const).map(s => (
            <button key={s} onClick={() => setFilterScope(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterScope === s ? 'bg-indigo text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
              }`}>
              {s === 'all' ? t('agenda.allMeetings') : t('agenda.myMeetings')}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {statusFilters.map(([id, label]) => (
            <button key={id} onClick={() => setFilterStatus(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === id ? 'bg-navy text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
              }`}>{label}</button>
          ))}
        </div>

        {/* Events list */}
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            {selectedDay
              ? `${selectedDay} ${MONTHS[month]}${selectedEvents.length === 0 ? ` · ${t('agenda.noEventDay')}` : ''}`
              : t('agenda.upcomingEvents')
            }
          </h3>

          <div className="space-y-3">
            {selectedEvents.map(event => {
              const start = new Date(event.startAt)
              const isDisabled = event.status === 'cancelled' || event.status === 'done'
              const isCreator = event.createdById === currentUser.id
              const canModify = isCreator || currentUser.role === 'admin'
              const isParticipant = event.participants.includes(currentUser.id) && !isCreator
              const myRsvp = event.rsvp?.[currentUser.id]
              const pCount = event.participants.length

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
                              return <Avatar key={pid} firstName={p.firstName} lastName={p.lastName} id={p.id} size="sm" src={p.avatarUrl} />
                            })}
                          </div>
                          <span>{pCount} {pCount > 1 ? t('agenda.participants') : t('agenda.participants')}</span>
                        </div>
                      </div>

                      {/* Creator/admin actions */}
                      {!isDisabled && canModify && (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setEditEvent(event)}
                            className="px-2.5 py-1 text-[11px] font-medium text-indigo border border-indigo/20 rounded-lg hover:bg-indigo-pale transition-colors">
                            {t('agenda.edit')}
                          </button>
                          <button onClick={() => cancelEvent(event.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger/5 transition-colors">
                            {t('agenda.cancelEvent')}
                          </button>
                          <button onClick={() => markDone(event.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-success border border-success/20 rounded-lg hover:bg-success/5 transition-colors">
                            {t('agenda.finish')}
                          </button>
                        </div>
                      )}
                      {/* Meeting minutes link for done events */}
                      {event.status === 'done' && minutesMap[event.id] && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <ClipboardList size={12} className="text-indigo shrink-0" />
                          <span className="text-[11px] text-indigo font-medium">{t('minutes.title')}</span>
                          <span className="text-[10px] text-muted">· {minutesMap[event.id].actions?.length ?? 0} action{(minutesMap[event.id].actions?.length ?? 0) !== 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {/* RSVP for participants (non-creator) */}
                      {!isDisabled && isParticipant && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted uppercase tracking-wide font-semibold">{t('agenda.myRsvp')}</span>
                          {!myRsvp && (
                            <>
                              <button
                                onClick={() => respondToEvent(event.id, 'accepted')}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg border border-border text-muted hover:border-success hover:text-success transition-colors">
                                <ThumbsUp size={10} /> {t('agenda.accept')}
                              </button>
                              <button
                                onClick={() => respondToEvent(event.id, 'declined')}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg border border-border text-muted hover:border-danger hover:text-danger transition-colors">
                                <ThumbsDown size={10} /> {t('agenda.decline')}
                              </button>
                            </>
                          )}
                          {myRsvp === 'accepted' && (
                            <>
                              <span className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-success/10 border border-success text-success">
                                <ThumbsUp size={10} /> {t('agenda.accept')}
                              </span>
                              <button
                                onClick={() => respondToEvent(event.id, 'declined')}
                                className="text-[11px] text-muted underline hover:text-danger transition-colors">
                                {t('agenda.decline')}
                              </button>
                            </>
                          )}
                          {myRsvp === 'declined' && (
                            <>
                              <span className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-danger/10 border border-danger text-danger">
                                <ThumbsDown size={10} /> {t('agenda.decline')}
                              </span>
                              <button
                                onClick={() => respondToEvent(event.id, 'accepted')}
                                className="text-[11px] text-muted underline hover:text-success transition-colors">
                                {t('agenda.accept')}
                              </button>
                            </>
                          )}
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
                <p className="text-sm text-muted mb-3">{t('agenda.noMeeting')}</p>
                <button onClick={() => setShowCreate(true)} className="text-sm text-indigo font-medium hover:underline">
                  {t('agenda.createMeeting')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showCreate || editEvent) && (
        <EventModal
          event={editEvent}
          prefill={editEvent ? undefined : createPrefill}
          orgUsers={orgUsers}
          myTeams={myTeams}
          myGroups={myGroups}
          onClose={() => { setShowCreate(false); setEditEvent(null) }}
          onSave={form => editEvent ? updateEvent(editEvent.id, form) : createEvent(form)}
        />
      )}

      {minutesEvent && pendingDoneId && (
        <MeetingMinutesModal
          event={minutesEvent}
          orgUsers={orgUsers}
          organizationId={currentOrg.id}
          createdBy={currentUser.id}
          onSaved={async () => {
            await confirmMarkDone(pendingDoneId)
            const m = await MeetingMinutesService.getByEvent(pendingDoneId)
            if (m) setMinutesMap(prev => ({ ...prev, [pendingDoneId]: m }))
          }}
          onSkip={() => confirmMarkDone(pendingDoneId)}
          onClose={() => { setMinutesEvent(null); setPendingDoneId(null) }}
        />
      )}

      {rsvpToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg bg-navy text-white text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <CheckCircle2 size={15} className="text-success shrink-0" />
          {rsvpToast}
        </div>
      )}
    </div>
  )
}
