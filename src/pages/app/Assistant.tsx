import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, FileText, MessageSquare, Zap, ChevronDown, Check, Search, CalendarPlus, ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MessageService } from '../../services/message.service'
import { MeetingMinutesService } from '../../services/meeting-minutes.service'
import { supabase } from '../../lib/supabase'
import { KB } from '../../data/axis-kb'
import type { AxisCategory, AxisEntry } from '../../data/axis-kb'
import type { Channel, Message } from '../../lib/types'

type Tab = 'chat' | 'summary' | 'action' | 'search'

// Simple markdown-ish renderer (bold, bullets, line breaks)
function AxisText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <p key={i} className="pl-3 text-sm text-ink before:content-['·'] before:mr-2 before:text-muted">
              {renderInline(line.slice(2))}
            </p>
          )
        }
        if (line === '') return <div key={i} className="h-1.5" />
        return <p key={i} className="text-sm text-ink leading-relaxed">{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

// Local structured summary — no AI
function buildSummary(messages: Message[], _currentUserId: string, nameMap: Record<string, string>, t: (key: string) => string, locale: string): string {
  if (messages.length === 0) return t('assistant.summaryNoMessages')

  const senderIds = [...new Set(messages.map(m => m.senderId))]
  const participants = senderIds.map(id => nameMap[id] ?? t('assistant.summaryMember')).join(', ')

  const first = new Date(messages[0].createdAt)
  const last = new Date(messages[messages.length - 1].createdAt)
  const fmt = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtTime = (d: Date) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  const dateRange = first.toDateString() === last.toDateString()
    ? `${fmt(first)} · ${fmtTime(first)} → ${fmtTime(last)}`
    : `${fmt(first)} → ${fmt(last)}`

  const filesCount = messages.filter(m => m.files?.length).length

  const countPerSender = messages.reduce((acc, m) => {
    acc[m.senderId] = (acc[m.senderId] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const lines = [
    `**${messages.length} messages** · ${dateRange}`,
    `**${t('assistant.summaryParticipants')} :** ${participants}`,
  ]

  if (filesCount > 0) lines.push(`**${t('assistant.summarySharedFiles')} :** ${filesCount}`)

  lines.push('', `**${t('assistant.summaryBreakdown')} :**`)
  for (const [id, count] of Object.entries(countPerSender)) {
    const name = nameMap[id] ?? t('assistant.summaryMember')
    lines.push(`- ${name} : ${count} message${count > 1 ? 's' : ''}`)
  }

  const recentLines = messages.slice(-5).map(m => {
    const name = nameMap[m.senderId] ?? t('assistant.summaryMember')
    const preview = m.content.slice(0, 60) + (m.content.length > 60 ? '…' : '')
    return `- **${name} :** ${preview}`
  })
  lines.push('', `**${t('assistant.summaryLastMessages')} :**`, ...recentLines)

  return lines.join('\n')
}

// ── Q&A bank constants ────────────────────────────────────────────────────────

const CATEGORY_ORDER: AxisCategory[] = [
  'general', 'onboarding', 'messages', 'teams', 'documents',
  'agenda', 'announcements', 'polls', 'minutes', 'profile',
  'notifications', 'security', 'admin', 'errors', 'axis',
]

const CATEGORY_I18N_KEYS: Record<AxisCategory, string> = {
  general:       'assistant.catGeneral',
  onboarding:    'assistant.catOnboarding',
  messages:      'assistant.catMessages',
  teams:         'assistant.catTeams',
  documents:     'assistant.catDocuments',
  agenda:        'assistant.catAgenda',
  announcements: 'assistant.catAnnouncements',
  polls:         'assistant.catPolls',
  minutes:       'assistant.catMinutes',
  profile:       'assistant.catProfile',
  notifications: 'assistant.catNotifications',
  security:      'assistant.catSecurity',
  admin:         'assistant.catAdmin',
  errors:        'assistant.catErrors',
  axis:          'assistant.catAxis',
}

const ACTION_LINK_KEYS: Record<string, string> = {
  '/creer':           'assistant.actionCreateOrg',
  '/app/messages':    'assistant.actionMessages',
  '/app/equipes':     'assistant.actionTeams',
  '/app/documents':   'assistant.actionDocuments',
  '/app/agenda':      'assistant.actionAgenda',
  '/app/annonces':    'assistant.actionAnnouncements',
  '/app/profil':      'assistant.actionProfile',
}

export function Assistant() {
  const { t, i18n } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('chat')

  // ── Q&A bank ──────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<AxisCategory>('general')
  const [selectedEntry, setSelectedEntry] = useState<AxisEntry | null>(null)

  const categoryEntries = KB.filter(e => e.category === selectedCategory)

  // ── Summary ───────────────────────────────────────────────────────────────
  const [convs, setConvs] = useState<Channel[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [summaryText, setSummaryText] = useState('')
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    MessageService.getConversations(currentOrg.id, currentUser.id).then(setConvs)
  }, [currentOrg.id, currentUser.id])

  const handleSummarize = useCallback(async () => {
    if (!selectedConvId) return
    setSummarizing(true)
    setSummaryText('')
    try {
      const { messages } = await MessageService.getMessages(selectedConvId, currentOrg.id, 50)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, firstname, lastname')
        .in('id', [...new Set(messages.map(m => m.senderId))])
      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach(p => { nameMap[p.id] = `${p.firstname ?? ''} ${p.lastname ?? ''}`.trim() || t('assistant.summaryMember') })
      setSummaryText(buildSummary(messages, currentUser.id, nameMap, t, i18n.language))
    } catch {
      setSummaryText(t('assistant.summaryLoadError'))
    } finally {
      setSummarizing(false)
    }
  }, [selectedConvId, currentOrg.id, currentUser.id])

  // ── Actions ───────────────────────────────────────────────────────────────
  const [actionDesc, setActionDesc] = useState('')
  const [actionDate, setActionDate] = useState('')
  const [actionSaving, setActionSaving] = useState(false)
  const [actionDone, setActionDone] = useState(false)

  const handleSaveAction = useCallback(async () => {
    if (!actionDesc.trim() || actionSaving) return
    setActionSaving(true)
    try {
      await MeetingMinutesService.createStandaloneAction({
        organizationId: currentOrg.id,
        createdBy: currentUser.id,
        description: actionDesc.trim(),
        dueDate: actionDate || null,
      })
      setActionDone(true)
      setTimeout(() => { setActionDone(false); setActionDesc(''); setActionDate('') }, 2000)
    } catch {
      await navigator.clipboard.writeText(actionDesc.trim()).catch(() => {})
      setActionDone(true)
      setTimeout(() => setActionDone(false), 2000)
    } finally {
      setActionSaving(false)
    }
  }, [actionDesc, actionDate, actionSaving, currentOrg.id, currentUser.id])

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; link?: string; sub?: string }[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async () => {
    const q = searchQ.trim()
    if (!q || searching) return
    setSearching(true)
    setSearchResults([])
    try {
      const pattern = `%${q}%`
      const [docsRes, minutesRes] = await Promise.all([
        supabase.from('documents').select('id, title, created_at').ilike('title', pattern).eq('organization_id', currentOrg.id).limit(5),
        supabase.from('meeting_minutes').select('id, title, created_at').ilike('title', pattern).eq('organization_id', currentOrg.id).limit(5),
      ])

      const results: { type: string; title: string; link?: string; sub?: string }[] = []
      ;(docsRes.data ?? []).forEach(d => results.push({ type: t('documents.title'), title: d.title, link: '/app/documents', sub: new Date(d.created_at).toLocaleDateString() }))
      ;(minutesRes.data ?? []).forEach(m => results.push({ type: t('minutes.title'), title: m.title, link: '/app/agenda', sub: new Date(m.created_at).toLocaleDateString() }))

      setSearchResults(results)
    } catch { /* silent */ } finally {
      setSearching(false)
    }
  }, [searchQ, searching, currentOrg.id])

  const TABS: { id: Tab; icon: typeof MessageSquare; label: string }[] = [
    { id: 'chat',    icon: MessageSquare, label: t('assistant.tabChat') },
    { id: 'summary', icon: FileText,      label: t('assistant.tabSummary') },
    { id: 'action',  icon: Zap,           label: t('assistant.tabAction') },
    { id: 'search',  icon: Search,        label: t('assistant.tabSearch') },
  ]

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 border-b border-border shrink-0 bg-surface">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-indigo" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">AXIS</h2>
            <p className="text-[11px] text-muted">{t('assistant.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-indigo text-indigo'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat / Q&A bank ── */}
      {tab === 'chat' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Category pills */}
          <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              {CATEGORY_ORDER.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSelectedEntry(null) }}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo text-white'
                      : 'bg-bg border border-border text-muted hover:text-ink hover:border-indigo/40'
                  }`}
                >
                  {t(CATEGORY_I18N_KEYS[cat])}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedEntry ? (
              /* Answer view */
              <div className="p-4 space-y-4">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
                >
                  <ArrowLeft size={13} />
                  {t('assistant.backToQuestions')}
                </button>

                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-indigo uppercase tracking-wide">
                    {t(CATEGORY_I18N_KEYS[selectedCategory])}
                  </p>
                  <h3 className="text-sm font-semibold text-ink leading-snug">
                    {t('axisKb.' + selectedEntry.id + '-q', { defaultValue: selectedEntry.keywords[0] })}
                  </h3>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4">
                  <AxisText text={t('axisKb.' + selectedEntry.id + '-a', { defaultValue: selectedEntry.answer })} />
                </div>

                {selectedEntry.action && (
                  <Link
                    to={selectedEntry.action.link}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo bg-indigo/8 hover:bg-indigo/15 rounded-xl transition-colors"
                  >
                    <Sparkles size={13} />
                    {t(ACTION_LINK_KEYS[selectedEntry.action.link] ?? '', { defaultValue: selectedEntry.action.label })}
                  </Link>
                )}
              </div>
            ) : (
              /* Question list */
              <div className="p-3 space-y-1.5">
                <p className="text-[11px] text-muted px-1 pb-1">
                  {categoryEntries.length !== 1 ? t('assistant.questionCountPlural', { count: String(categoryEntries.length) }) : t('assistant.questionCount', { count: String(categoryEntries.length) })}
                </p>
                {categoryEntries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-surface border border-border rounded-xl hover:border-indigo hover:text-indigo transition-colors text-left group"
                  >
                    <span className="flex-1 text-sm text-ink group-hover:text-indigo transition-colors">
                      {t('axisKb.' + entry.id + '-q', { defaultValue: entry.keywords[0] })}
                    </span>
                    <ChevronRight size={14} className="text-muted group-hover:text-indigo shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {tab === 'summary' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-muted">{t('assistant.summaryHintSelect')}</p>

          <div className="relative">
            <select
              value={selectedConvId ?? ''}
              onChange={e => { setSelectedConvId(e.target.value || null); setSummaryText('') }}
              className="w-full appearance-none bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-ink pr-8 focus:outline-none focus:border-indigo"
            >
              <option value="">{t('assistant.selectConv')}</option>
              {convs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>

          <button
            onClick={handleSummarize}
            disabled={!selectedConvId || summarizing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {summarizing ? t('assistant.summarizing') : t('assistant.generateSummary')}
          </button>

          {summaryText && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <AxisText text={summaryText} />
            </div>
          )}
        </div>
      )}

      {/* ── Action ── */}
      {tab === 'action' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-muted">{t('assistant.actionHint')}</p>

          <div className="space-y-3">
            <textarea
              value={actionDesc}
              onChange={e => setActionDesc(e.target.value)}
              placeholder={t('assistant.actionPlaceholderTask')}
              rows={3}
              className="w-full resize-none bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-indigo"
            />
            <div>
              <label className="block text-[11px] text-muted mb-1.5 font-medium uppercase tracking-wide">{t('assistant.dueDateLabel')}</label>
              <input
                type="date"
                value={actionDate}
                onChange={e => setActionDate(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-indigo"
              />
            </div>
          </div>

          <button
            onClick={handleSaveAction}
            disabled={!actionDesc.trim() || actionSaving}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
              actionDone
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-indigo text-white hover:opacity-90 disabled:opacity-40'
            }`}
          >
            {actionDone
              ? <><Check size={14} />{t('assistant.actionSavedLabel')}</>
              : <><Zap size={14} />{t('assistant.createTask')}</>
            }
          </button>

          <div className="border-t border-border pt-4">
            <p className="text-[11px] text-muted mb-3 font-medium uppercase tracking-wide">{t('assistant.taskShortcuts')}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/app/agenda')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink bg-surface border border-border rounded-xl hover:border-indigo hover:text-indigo transition-colors text-left"
              >
                <CalendarPlus size={15} className="text-muted shrink-0" />
                {t('assistant.createMeetingShortcut')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      {tab === 'search' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-muted">{t('assistant.searchHint')}</p>

          <div className="flex gap-2">
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder={t('assistant.searchPlaceholder')}
              className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-indigo"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQ.trim() || searching}
              className="px-4 py-2.5 bg-indigo text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Search size={15} />
            </button>
          </div>

          {searching && <p className="text-sm text-muted text-center py-4">{t('assistant.searching')}</p>}

          {!searching && searchResults.length === 0 && searchQ && (
            <p className="text-sm text-muted text-center py-4">{t('assistant.noResults', { query: searchQ })}</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => r.link && navigate(r.link)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 bg-surface border border-border rounded-xl hover:border-indigo transition-colors text-left"
                >
                  <span className="text-[10px] font-semibold text-indigo bg-indigo/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{r.type}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{r.title}</p>
                    {r.sub && <p className="text-xs text-muted">{r.sub}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
