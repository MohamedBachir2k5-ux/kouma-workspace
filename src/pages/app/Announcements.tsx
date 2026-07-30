import { useState, useEffect } from 'react'
import { Megaphone, Pin, Plus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnnouncementService, type Announcement } from '../../services/announcement.service'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/utils'

function AnnouncementCard({ ann, onRead }: { ann: Announcement; onRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  function handleExpand() {
    if (!expanded && !ann.read) onRead(ann.id)
    setExpanded(e => !e)
  }

  return (
    <div className={`bg-surface rounded-xl border transition-colors ${ann.read ? 'border-border' : 'border-indigo/40'}`}>
      <button type="button" onClick={handleExpand} className="w-full flex items-start gap-4 p-4 text-left">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ann.pinned ? 'bg-amber/10' : 'bg-indigo/10'}`}>
          {ann.pinned
            ? <Pin size={16} className="text-amber-500" />
            : <Megaphone size={16} className="text-indigo" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-semibold leading-snug ${ann.read ? 'text-muted' : 'text-ink'}`}>{ann.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {!ann.read && <span className="w-2 h-2 rounded-full bg-indigo shrink-0" />}
              {expanded ? <ChevronUp size={14} className="text-faint" /> : <ChevronDown size={14} className="text-faint" />}
            </div>
          </div>
          <p className="text-[11px] text-faint mt-0.5">{formatDate(ann.createdAt)}</p>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-border pt-3">
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{ann.body}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (ann: Announcement) => void
}) {
  const { t } = useTranslation()
  const { currentOrg, currentUser } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim() || !body.trim() || saving) return
    setSaving(true)
    setError(null)
    const { announcement, error: err } = await AnnouncementService.create(
      currentOrg.id,
      currentUser.id,
      title.trim(),
      body.trim(),
      pinned,
    )
    setSaving(false)
    if (err || !announcement) { setError(err ?? t('announcements.creationError')); return }
    onCreated(announcement)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy text-base">{t('announcements.newAnnouncement')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('announcements.announcementTitleLabel')} *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              placeholder={t('announcements.announcementTitlePlaceholder')}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('announcements.announcementContentLabel')} *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
              placeholder={t('announcements.announcementContentPlaceholder')}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded" />
            <span className="text-xs text-ink">{t('announcements.pinThis')}</span>
          </label>
        </div>
        {error && <p className="text-xs text-danger mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={!title.trim() || !body.trim() || saving}
            className="flex-1 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : t('announcements.publish')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Announcements() {
  const { t } = useTranslation()
  const { currentOrg, currentUser } = useAuth()
  const isAdmin = currentUser.role === 'admin'
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AnnouncementService.list(currentOrg.id, currentUser.id)
      .then(setAnnouncements)
      .finally(() => setLoading(false))
  }, [currentOrg.id, currentUser.id])

  function handleRead(id: string) {
    AnnouncementService.markRead(id, currentUser.id)
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  const unreadCount = announcements.filter(a => !a.read).length
  const pinned = announcements.filter(a => a.pinned)
  const others = announcements.filter(a => !a.pinned)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-bg px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-ink">{t('nav.announcements')}</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-indigo text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
            )}
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo text-white text-xs font-semibold rounded-lg hover:opacity-90">
              <Plus size={14} /> {t('announcements.newAnnouncement')}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-faint animate-spin" />
          </div>
        )}

        {!loading && announcements.length === 0 && (
          <div className="py-16 text-center">
            <Megaphone size={32} className="text-faint mx-auto mb-3" />
            <p className="text-sm text-muted">{t('announcements.noAnnouncements')}</p>
            {isAdmin && (
              <button onClick={() => setShowCreate(true)} className="mt-4 text-sm text-indigo hover:underline">
                {t('announcements.publishFirst')}
              </button>
            )}
          </div>
        )}

        {pinned.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">{t('announcements.pinned')}</h3>
            <div className="space-y-2">
              {pinned.map(a => <AnnouncementCard key={a.id} ann={a} onRead={handleRead} />)}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            {pinned.length > 0 && <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">{t('announcements.recent')}</h3>}
            <div className="space-y-2">
              {others.map(a => <AnnouncementCard key={a.id} ann={a} onRead={handleRead} />)}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={ann => setAnnouncements(prev => [ann, ...prev])}
        />
      )}
    </div>
  )
}
