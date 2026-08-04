import { useState, useEffect } from 'react'
import { Plus, Pin, PinOff, Pencil, Trash2, Megaphone, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnnouncementService, type Announcement } from '../../services/announcement.service'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../lib/utils'

function AnnouncementModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Announcement | null
  onClose: () => void
  onSaved: (a: Announcement) => void
}) {
  const { t } = useTranslation()
  const { currentOrg, currentUser } = useAuth()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [pinned, setPinned] = useState(existing?.pinned ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim() || !body.trim() || saving) return
    setSaving(true)
    setError(null)

    if (existing) {
      const { error: err } = await AnnouncementService.update(existing.id, {
        title: title.trim(),
        body: body.trim(),
        pinned,
      })
      setSaving(false)
      if (err) { setError(err); return }
      onSaved({ ...existing, title: title.trim(), body: body.trim(), pinned })
    } else {
      const { announcement, error: err } = await AnnouncementService.create(
        currentOrg.id,
        currentUser.id,
        title.trim(),
        body.trim(),
        pinned,
      )
      setSaving(false)
      if (err || !announcement) { setError(err ?? t('announcements.creationError')); return }
      onSaved(announcement)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface rounded-2xl border border-border p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-navy text-lg">
            {existing ? t('admin.editAnnouncement') : t('announcements.newAnnouncement')}
          </h3>
          <button onClick={onClose} className="p-2.5 rounded-lg text-muted hover:text-ink hover:bg-bg">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('announcements.announcementTitleLabel')} *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              placeholder={t('announcements.announcementTitlePlaceholder')}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('announcements.announcementContentLabel')} *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder={t('announcements.announcementContentPlaceholder')}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pinned}
              onChange={e => setPinned(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo"
            />
            <span className="text-sm text-ink">{t('announcements.pinThis')}</span>
          </label>
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mt-4">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !body.trim() || saving}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {existing ? t('common.save') : t('announcements.publish')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminAnnouncements() {
  const { t } = useTranslation()
  const { currentOrg, currentUser } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)

  useEffect(() => {
    AnnouncementService.list(currentOrg.id, currentUser.id)
      .then(setAnnouncements)
      .finally(() => setLoading(false))
  }, [currentOrg.id, currentUser.id])

  function handleSaved(ann: Announcement) {
    setAnnouncements(prev => {
      const exists = prev.find(a => a.id === ann.id)
      if (exists) return prev.map(a => a.id === ann.id ? ann : a)
      return [ann, ...prev]
    })
  }

  async function togglePin(ann: Announcement) {
    setPinError(null)
    const { error } = await AnnouncementService.update(ann.id, { pinned: !ann.pinned })
    if (error) { setPinError(error); return }
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, pinned: !a.pinned } : a))
  }

  async function handleDelete(ann: Announcement) {
    if (!window.confirm(t('admin.announcementDeleteConfirm', { title: ann.title }))) return
    setDeletingId(ann.id)
    setDeleteError(null)
    const { error } = await AnnouncementService.delete(ann.id)
    setDeletingId(null)
    if (error) { setDeleteError(error); return }
    setAnnouncements(prev => prev.filter(a => a.id !== ann.id))
  }

  const pinned = announcements.filter(a => a.pinned)
  const others = announcements.filter(a => !a.pinned)

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      {deleteError && (
        <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mb-4">{deleteError}</p>
      )}
      {pinError && (
        <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mb-4">{pinError}</p>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{t('admin.announcementsTitle')}</h1>
          <p className="text-sm text-muted mt-0.5">
            {t(announcements.length !== 1 ? 'admin.announcementsCountPlural' : 'admin.announcementsCount', { count: String(announcements.length) })}
            {' · '}
            {t(pinned.length !== 1 ? 'admin.pinnedCountPlural' : 'admin.pinnedCount', { count: String(pinned.length) })}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t('announcements.newAnnouncement')}</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-faint animate-spin" />
        </div>
      )}

      {!loading && announcements.length === 0 && (
        <div className="py-20 text-center">
          <Megaphone size={36} className="text-faint mx-auto mb-3" />
          <p className="text-sm text-muted mb-4">{t('announcements.noAnnouncements')}</p>
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="px-4 py-2.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('announcements.publishFirst')}
          </button>
        </div>
      )}

      {!loading && announcements.length > 0 && (
        <div className="space-y-3">
          {[...pinned, ...others].map(ann => (
            <div
              key={ann.id}
              className={`bg-surface rounded-xl border p-5 ${ann.pinned ? 'border-amber/40' : 'border-border'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ann.pinned ? 'bg-amber/10' : 'bg-indigo/10'}`}>
                    {ann.pinned
                      ? <Pin size={15} className="text-amber-500" />
                      : <Megaphone size={15} className="text-indigo" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-ink">{ann.title}</h3>
                      {ann.pinned && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber/10 text-amber-600 rounded-full">{t('admin.announcementPinned')}</span>
                      )}
                    </div>
                    <p className="text-xs text-faint mt-0.5">{formatDate(ann.createdAt)}</p>
                    <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-2">{ann.body}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePin(ann)}
                    title={ann.pinned ? t('admin.unpin') : t('admin.pin')}
                    className="p-2 rounded-lg text-muted hover:text-amber-500 hover:bg-amber/10 transition-colors"
                  >
                    {ann.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                  </button>
                  <button
                    onClick={() => { setEditing(ann); setShowModal(true) }}
                    title={t('common.edit')}
                    className="p-2 rounded-lg text-muted hover:text-indigo hover:bg-indigo/10 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(ann)}
                    disabled={deletingId === ann.id}
                    title={t('common.delete')}
                    className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                  >
                    {deletingId === ann.id
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Trash2 size={15} />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AnnouncementModal
          existing={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
