import { useState, useRef, useEffect } from 'react'
import { Bell, Smartphone, LogOut, Moon, X, Check, Camera, KeyRound, Monitor, Tablet, Loader2, Sun, Trash2, Download, MessageSquare, CalendarDays, Users, Megaphone, FileText, ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { UserService } from '../../services/user.service'
import { AuthService } from '../../services/auth.service'
import { KeyService } from '../../services/key.service'
import { SessionService } from '../../services/session.service'
import type { SessionRecord } from '../../services/session.service'
import { NotifPrefService } from '../../services/notification.service'
import type { NotifPref, NotifPrefType } from '../../services/notification.service'
import { PushService } from '../../services/push.service'
import { Avatar } from '../../components/ui/Avatar'
import i18n from '../../i18n/index'

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
]

type Tab = 'moi' | 'securite' | 'preferences'

const DEFAULT_NOTIF_PREFS: NotifPref[] = [
  { type: 'new_message',    push: true,  inapp: true },
  { type: 'meeting_invite', push: true,  inapp: true },
  { type: 'team_update',    push: false, inapp: true },
  { type: 'announcement',   push: true,  inapp: true },
  { type: 'document_shared', push: false, inapp: true },
]

function DeviceIcon({ platform }: { platform: string | null }) {
  if (!platform) return <Smartphone size={17} className="text-indigo" />
  const p = platform.toLowerCase()
  if (p.includes('ios') || p.includes('android')) return <Smartphone size={17} className="text-indigo" />
  if (p.includes('ipad')) return <Tablet size={17} className="text-indigo" />
  return <Monitor size={17} className="text-indigo" />
}

function formatRelative(iso: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('admin.justNow')
  if (mins < 60) return t('admin.minutesAgo', { count: mins })
  const h = Math.floor(mins / 60)
  if (h < 24) return t('admin.hoursAgo', { count: h })
  return t('admin.daysAgo', { count: Math.floor(h / 24) })
}

const CROP_PX = 260
const OUTPUT_PX = 400

function AvatarCropModal({ src, onConfirm, onCancel }: {
  src: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const drag = useRef<{ active: boolean; lx: number; ly: number }>({ active: false, lx: 0, ly: 0 })

  const minZoom = nat ? Math.max(CROP_PX / nat.w, CROP_PX / nat.h) : 1

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const z0 = Math.max(CROP_PX / img.naturalWidth, CROP_PX / img.naturalHeight)
      setNat({ w: img.naturalWidth, h: img.naturalHeight })
      setZoom(z0)
      setPos({ x: (CROP_PX - img.naturalWidth * z0) / 2, y: (CROP_PX - img.naturalHeight * z0) / 2 })
    }
    img.src = src
  }, [src])

  function clampPos(p: { x: number; y: number }, z: number, n: { w: number; h: number }) {
    const w = n.w * z, h = n.h * z
    return {
      x: w >= CROP_PX ? Math.min(0, Math.max(CROP_PX - w, p.x)) : (CROP_PX - w) / 2,
      y: h >= CROP_PX ? Math.min(0, Math.max(CROP_PX - h, p.y)) : (CROP_PX - h) / 2,
    }
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = { active: true, lx: e.clientX, ly: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active || !nat) return
    const dx = e.clientX - drag.current.lx, dy = e.clientY - drag.current.ly
    drag.current.lx = e.clientX; drag.current.ly = e.clientY
    setPos(p => clampPos({ x: p.x + dx, y: p.y + dy }, zoom, nat))
  }
  function onUp() { drag.current.active = false }

  function onZoomChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!nat) return
    const z = Number(e.target.value)
    setZoom(z)
    setPos(p => clampPos(p, z, nat))
  }

  function confirm() {
    if (!nat || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = OUTPUT_PX; canvas.height = OUTPUT_PX
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.arc(OUTPUT_PX / 2, OUTPUT_PX / 2, OUTPUT_PX / 2, 0, Math.PI * 2)
    ctx.clip()
    const r = OUTPUT_PX / CROP_PX
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, pos.x * r, pos.y * r, nat.w * zoom * r, nat.h * zoom * r)
      canvas.toBlob(b => { if (b) onConfirm(b) }, 'image/jpeg', 0.92)
    }
    img.src = src
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={onCancel}>
      <div className="bg-surface rounded-2xl border border-border p-5 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-navy text-base">{t('profile.cropTitle')}</h3>
          <button onClick={onCancel} aria-label={t('common.close')} className="w-12 h-12 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <p className="text-xs text-muted mb-4">{t('profile.cropHint')}</p>

        <div
          className="relative mx-auto mb-4 touch-none select-none"
          style={{ width: CROP_PX, height: CROP_PX, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-indigo)', cursor: 'grab', boxSizing: 'content-box' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        >
          {nat ? (
            <img src={src} alt="" draggable={false}
              style={{ position: 'absolute', left: pos.x, top: pos.y, width: nat.w * zoom, height: nat.h * zoom, pointerEvents: 'none' }}
            />
          ) : (
            <div className="w-full h-full bg-bg flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-faint" />
            </div>
          )}
        </div>

        {nat && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <ZoomOut size={14} className="text-faint shrink-0" />
            <input type="range" min={minZoom} max={minZoom * 3} step={minZoom * 0.01}
              value={zoom} onChange={onZoomChange} className="flex-1 accent-indigo" />
            <ZoomIn size={14} className="text-faint shrink-0" />
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg transition-colors">{t('common.cancel')}</button>
          <button onClick={confirm} disabled={!nat}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
            {t('common.confirm')}
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

export function Profile() {
  const { t } = useTranslation()
  const { currentUser, currentOrg, currentSessionId, signOut } = useAuth()
  const photoRef = useRef<HTMLInputElement>(null)

  const TABS: { value: Tab; label: string }[] = [
    { value: 'moi',         label: t('nav.profile') },
    { value: 'securite',    label: t('profile.security') },
    { value: 'preferences', label: t('profile.preferences') },
  ]
  const [tab, setTab] = useState<Tab>('moi')
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentUser.avatarUrl ?? null)
  const [editing, setEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [changingPin, setChangingPin] = useState(false)
  const [pinSaving, setPinSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  const [profile, setProfile] = useState({
    firstName: currentUser.firstName,
    lastName:  currentUser.lastName,
    phone:     currentUser.phone ?? '',
    language:  i18n.language as string,
  })
  const [draft, setDraft] = useState(profile)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState<string | null>(null)

  // Self-delete
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleSelfDelete() {
    if (deleteConfirm !== currentUser.email) return
    setDeleting(true)
    setDeleteError(null)
    const { error } = await UserService.selfDeleteAccount(currentOrg.id)
    if (error) { setDeleteError(error); setDeleting(false); return }
    await signOut()
  }

  // Sessions
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  // Preferences
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('kouma_theme') as 'light' | 'dark') ?? 'light'
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  const pushSupported = PushService.isSupported()
  const [notifEnabled, setNotifEnabled] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  // Per-type notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotifPref[]>(DEFAULT_NOTIF_PREFS)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  // PWA install
  const [pwaPrompt, setPwaPrompt] = useState<Event | null>(
    (window as Window & { __pwa_prompt?: Event }).__pwa_prompt ?? null
  )
  const [pwaInstalled, setPwaInstalled] = useState(false)

  useEffect(() => {
    if (tab === 'securite' && sessions.length === 0) {
      setSessionsLoading(true)
      SessionService.list(currentUser.id).then(data => {
        setSessions(data)
        setSessionsLoading(false)
      })
    }
    if (tab === 'preferences' && !prefsLoaded) {
      NotifPrefService.getAll(currentUser.id, currentOrg.id).then(rows => {
        if (rows.length > 0) {
          setNotifPrefs(DEFAULT_NOTIF_PREFS.map(d => rows.find(r => r.type === d.type) ?? d))
        }
        setPrefsLoaded(true)
      })
    }
  }, [tab, currentUser.id, currentOrg.id, sessions.length, prefsLoaded])

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPhotoError(null)
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCropConfirm(blob: Blob) {
    setCropSrc(null)
    setPhotoUploading(true)
    const previewUrl = URL.createObjectURL(blob)
    setPhotoPreview(previewUrl)
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    const { avatarUrl, error } = await UserService.uploadAvatar(currentUser.id, currentOrg.id, file)
    setPhotoUploading(false)
    URL.revokeObjectURL(previewUrl)
    if (!error && avatarUrl) {
      setPhotoPreview(avatarUrl)
    } else {
      setPhotoPreview(currentUser.avatarUrl ?? null)
      setPhotoError(error ?? t('profile.photoUploadError'))
    }
  }

  function openEdit() { setDraft(profile); setEditing(true) }

  async function saveEdit() {
    setEditSaving(true)
    setEditError(null)
    const { error } = await UserService.updateProfile(currentUser.id, {
      firstname: draft.firstName,
      lastname: draft.lastName,
      phone: draft.phone || null,
      language: draft.language,
    })
    setEditSaving(false)
    if (error) { setEditError(error); return }
    setProfile(draft)
    if (draft.language !== i18n.language) i18n.changeLanguage(draft.language)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function savePassword() {
    setPwError(null)
    setPinSaving(true)
    const { error } = await AuthService.updatePassword(pwForm.next)
    if (error) { setPwError(error); setPinSaving(false); return }
    const { error: keyError } = await KeyService.rewrapPrivateKey(currentUser.id, pwForm.next)
    setPinSaving(false)
    if (keyError) { setPwError(t('errors.pinUpdatedRewrapFailed')); return }
    setPwForm({ current: '', next: '', confirm: '' })
    setChangingPin(false)
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  async function revokeSession(id: string) {
    setRevoking(id)
    await SessionService.revoke(id)
    setSessions(prev => prev.filter(s => s.id !== id))
    setRevoking(null)
    if (id === currentSessionId) signOut()
  }

  async function revokeAllOthers() {
    if (!currentSessionId) return
    await SessionService.revokeAll(currentUser.id, currentSessionId)
    setSessions(prev => prev.filter(s => s.isCurrent))
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('kouma_theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  async function toggleNotifications() {
    if (!pushSupported) return
    if (notifEnabled) {
      setNotifEnabled(false)
    } else {
      const perm = await Notification.requestPermission()
      setNotifEnabled(perm === 'granted')
    }
  }

  async function toggleNotifPref(type: NotifPrefType, field: 'push' | 'inapp') {
    const current = notifPrefs.find(p => p.type === type)!
    const next = { ...current, [field]: !current[field] }
    setNotifPrefs(prev => prev.map(p => p.type === type ? next : p))
    await NotifPrefService.upsert(currentUser.id, currentOrg.id, type, next.push, next.inapp)
  }

  async function installPWA() {
    const prompt = pwaPrompt as (Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> })
    if (!prompt?.prompt || !prompt?.userChoice) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setPwaInstalled(true)
      setPwaPrompt(null)
    }
  }

  const pwValid = /^\d{6}$/.test(pwForm.current) && /^\d{6}$/.test(pwForm.next) && pwForm.next === pwForm.confirm

  return (
    <div className="flex-1 overflow-y-auto">
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <div className="px-4 py-4 max-w-xl">

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative shrink-0">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <div className="relative">
              {photoPreview
                ? <img src={photoPreview} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                : <Avatar firstName={profile.firstName} lastName={profile.lastName} id={currentUser.id} size="xl" src={currentUser.avatarUrl} />
              }
              {photoUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <button onClick={() => !photoUploading && photoRef.current?.click()}
              disabled={photoUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo rounded-full flex items-center justify-center border-2 border-surface hover:bg-indigo/90 transition-colors disabled:opacity-50">
              <Camera size={11} className="text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-navy">{profile.firstName} {profile.lastName}</h2>
            <p className="text-xs text-muted">{currentUser.jobTitle ?? (currentUser.role === 'admin' ? t('common.administrator') : t('common.collaborator'))}</p>
            <p className="text-xs text-faint mt-0.5">{currentUser.email}</p>
            {photoError && <p className="text-xs text-danger mt-1">{photoError}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-bg border border-border rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.value ? 'bg-surface shadow-sm text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB MOI ── */}
        {tab === 'moi' && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
              <div className="px-4 py-3">
                <div className="text-xs text-muted mb-0.5">{t('profile.organisation')}</div>
                <div className="text-sm font-semibold text-ink">{currentOrg.name}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-xs text-muted mb-0.5">{t('profile.department')}</div>
                <div className="text-sm font-semibold text-ink">{currentUser.department ?? '-'}</div>
              </div>
              {currentUser.jobTitle && (
                <div className="px-4 py-3">
                  <div className="text-xs text-muted mb-0.5">{t('profile.jobTitle')}</div>
                  <div className="text-sm font-semibold text-ink">{currentUser.jobTitle}</div>
                </div>
              )}
              <div className="px-4 py-3">
                <div className="text-xs text-muted mb-0.5">{t('profile.phone')}</div>
                <div className="text-sm font-semibold text-ink">{profile.phone || '-'}</div>
              </div>
            </div>

            <button onClick={openEdit}
              className={`w-full py-3 border rounded-xl text-sm font-medium transition-colors ${
                saved ? 'border-success/30 bg-success/5 text-success' : 'border-border text-muted hover:bg-bg'
              }`}>
              {saved
                ? <span className="flex items-center justify-center gap-2"><Check size={14} /> {t('profile.profileUpdated')}</span>
                : t('profile.editProfile')}
            </button>

            <button onClick={signOut}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-danger/5 border border-danger/20 rounded-xl text-danger text-sm font-medium hover:bg-danger/10 transition-colors">
              <LogOut size={16} /> {t('profile.logout')}
            </button>
          </div>
        )}

        {/* ── TAB SÉCURITÉ ── */}
        {tab === 'securite' && (
          <div className="space-y-4">
            {/* PIN change */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">{t('profile.pin')}</h3>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <button onClick={() => setChangingPin(true)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                    <KeyRound size={16} className="text-indigo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${pwSaved ? 'text-success' : 'text-ink'}`}>
                      {pwSaved ? t('profile.pinUpdated') : t('profile.changePinTitle')}
                    </div>
                    <div className="text-xs text-muted">{t('profile.changePinDesc')}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Active sessions */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">{t('profile.connectedDevices')}</h3>
                {sessions.filter(s => !s.isCurrent).length > 0 && (
                  <button onClick={revokeAllOthers} className="text-xs text-danger hover:underline">
                    {t('profile.disconnectOthers')}
                  </button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-faint" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted bg-surface rounded-xl border border-border">
                  {t('profile.noSessions')}
                </div>
              ) : (
                <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {sessions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-9 h-9 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                        <DeviceIcon platform={s.platform} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink truncate">{s.deviceName ?? t('profile.unknownDevice')}</span>
                          {s.isCurrent && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-success/10 text-success rounded-full shrink-0">
                              {t('profile.thisDevice')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">{s.browser} · {formatRelative(s.lastSeenAt, t)}</div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => revokeSession(s.id)}
                          disabled={revoking === s.id}
                          className="p-2.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                          title={t('profile.disconnect')}
                        >
                          {revoking === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB PRÉFÉRENCES ── */}
        {tab === 'preferences' && (
          <div className="space-y-5">
            {/* Push notifications master toggle */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">{t('profile.notifications')}</h3>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <button onClick={toggleNotifications} disabled={!pushSupported}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors ${pushSupported ? 'hover:bg-bg' : 'opacity-50 cursor-not-allowed'}`}>
                  <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                    <Bell size={16} className="text-indigo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{t('profile.pushNotifs')}</div>
                    <div className="text-xs text-muted">
                      {!pushSupported
                        ? t('profile.pushNotSupported')
                        : notifEnabled ? t('profile.pushEnabled') : t('profile.pushDisabled')}
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${notifEnabled && pushSupported ? 'bg-indigo' : 'bg-border'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifEnabled && pushSupported ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Per-type notification preferences */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">{t('profile.notifByType')}</h3>
              <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
                {([
                  { type: 'new_message'    as NotifPrefType, label: t('profile.notifNewMessage'),    icon: MessageSquare },
                  { type: 'meeting_invite' as NotifPrefType, label: t('profile.notifMeetingInvite'), icon: CalendarDays },
                  { type: 'team_update'   as NotifPrefType, label: t('profile.notifTeamUpdate'),    icon: Users },
                  { type: 'announcement'  as NotifPrefType, label: t('profile.notifAnnouncement'),  icon: Megaphone },
                  { type: 'document_shared' as NotifPrefType, label: t('profile.notifDocumentShared'), icon: FileText },
                ]).map(({ type, label, icon: Icon }) => {
                  const pref = notifPrefs.find(p => p.type === type) ?? { type, push: true, inapp: true }
                  return (
                    <div key={type} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-indigo" />
                      </div>
                      <div className="flex-1 text-sm font-medium text-ink">{label}</div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-faint uppercase">{t('profile.pushLabel')}</span>
                          <button onClick={() => toggleNotifPref(type, 'push')}
                            className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${pref.push ? 'bg-indigo' : 'bg-border'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform ${pref.push ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-faint uppercase">{t('profile.inappLabel')}</span>
                          <button onClick={() => toggleNotifPref(type, 'inapp')}
                            className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${pref.inapp ? 'bg-indigo' : 'bg-border'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform ${pref.inapp ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Theme */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">{t('profile.appearance')}</h3>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <button onClick={toggleTheme}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                    {theme === 'light' ? <Sun size={16} className="text-indigo" /> : <Moon size={16} className="text-indigo" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{t('profile.appearance')}</div>
                    <div className="text-xs text-muted">{t('profile.appearanceDesc')}</div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${theme === 'dark' ? 'bg-indigo' : 'bg-border'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">{t('profile.language')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {languages.map(l => (
                  <button key={l.value} type="button"
                    onClick={() => {
                      i18n.changeLanguage(l.value)
                      localStorage.setItem('kouma_lang', l.value)
                      setProfile(p => ({ ...p, language: l.value }))
                      UserService.updateProfile(currentUser.id, { language: l.value })
                    }}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                      i18n.language === l.value ? 'border-navy bg-navy text-white' : 'border-border bg-surface text-muted hover:border-navy/30 hover:bg-bg'
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PWA install */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">{t('profile.appSection')}</h3>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                {pwaInstalled ? (
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <Check size={16} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-success">{t('profile.appInstalled')}</div>
                      <div className="text-xs text-muted">{t('profile.appInstalledDesc')}</div>
                    </div>
                  </div>
                ) : pwaPrompt ? (
                  <button onClick={installPWA}
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                      <Download size={16} className="text-indigo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink">{t('profile.installApp')}</div>
                      <div className="text-xs text-muted">{t('profile.installAppDesc')}</div>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                      <Smartphone size={16} className="text-indigo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink">{t('profile.offlineMode')}</div>
                      <div className="text-xs text-muted">{t('profile.offlineModeDesc')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Zone de danger ── */}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold text-danger uppercase tracking-wide mb-3 px-1">{t('profile.dangerZone')}</p>
          <div className="rounded-xl border border-danger/20 bg-danger/3 p-4 space-y-2">
            <p className="text-sm font-medium text-ink">{t('profile.deleteAccountTitle')}</p>
            <p className="text-xs text-muted leading-relaxed">{t('profile.deleteAccountDesc')}</p>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError(null) }}
              className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger/8 transition-colors"
            >
              {t('profile.deleteAccountBtn')}
            </button>
          </div>
        </div>

        {/* ── Aide & Support ── */}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3 px-1">{t('profile.helpTitle')}</p>
          <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
            <a href="/resources/guides" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
              <div className="w-7 h-7 rounded-lg bg-indigo/10 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{t('profile.helpGuideTitle')}</div>
                <div className="text-xs text-muted">{t('profile.helpGuideDesc')}</div>
              </div>
            </a>
            <a href="/resources/support" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
              <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <MessageSquare size={14} className="text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{t('profile.helpSupportTitle')}</div>
                <div className="text-xs text-muted">{t('profile.helpSupportDesc')}</div>
              </div>
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-faint mt-6">{t('profile.version')}</p>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-danger">{t('profile.deleteAccountTitle')}</h3>
              {!deleting && <button onClick={() => setShowDeleteModal(false)} aria-label={t('common.close')} className="w-10 h-10 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={16} /></button>}
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl">
                <p className="text-xs text-danger leading-relaxed">{t('profile.deleteAccountWarning', { org: currentOrg.name })}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">{t('profile.deleteAccountConfirmLabel', { email: currentUser.email })}</label>
                <input
                  type="email"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={currentUser.email}
                  disabled={deleting}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger disabled:opacity-50"
                />
              </div>
              {deleteError && <p className="text-xs text-danger">{deleteError}</p>}
              <button
                onClick={handleSelfDelete}
                disabled={deleteConfirm !== currentUser.email || deleting}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 size={14} className="animate-spin" /> {t('common.loading')}</> : t('profile.deleteAccountConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit profile modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-navy">{t('profile.editTitle')}</h3>
              <button onClick={() => setEditing(false)} aria-label={t('common.close')} className="w-12 h-12 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('profile.firstName')}</label>
                  <input value={draft.firstName} onChange={e => setDraft(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('profile.lastName')}</label>
                  <input value={draft.lastName} onChange={e => setDraft(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('auth.email')}</label>
                <input value={currentUser.email} disabled
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-faint cursor-not-allowed" />
                <p className="mt-1 text-xs text-faint">{t('profile.emailReadonly')}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('profile.phone')}</label>
                <input type="tel" value={draft.phone} onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+XX XXXX XXXX"
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>
            </div>
            {editError && <p className="px-5 pb-2 text-xs text-danger">{editError}</p>}
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setEditing(false)} disabled={editSaving} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg disabled:opacity-40">{t('common.cancel')}</button>
              <button onClick={saveEdit} disabled={!draft.firstName.trim() || !draft.lastName.trim() || editSaving}
                className="flex-1 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                {editSaving && <Loader2 size={14} className="animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN modal */}
      {changingPin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setChangingPin(false)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-navy">{t('profile.changePinTitle')}</h3>
              <button onClick={() => setChangingPin(false)} aria-label={t('common.close')} className="w-12 h-12 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { field: 'current', label: t('profile.currentPin'), placeholder: '••••••' },
                { field: 'next',    label: t('profile.newPin'),     placeholder: t('profile.pin6digits') },
                { field: 'confirm', label: t('profile.confirmPin'), placeholder: '••••••' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{label}</label>
                  <input
                    type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={pwForm[field as keyof typeof pwForm]}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2.5 bg-bg border rounded-xl text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-navy ${
                      field === 'confirm' && pwForm.confirm && pwForm.next !== pwForm.confirm
                        ? 'border-danger focus:ring-danger' : 'border-border'
                    }`}
                  />
                </div>
              ))}
              {pwError && <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{pwError}</p>}
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setChangingPin(false)} disabled={pinSaving} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg disabled:opacity-40">{t('common.cancel')}</button>
              <button onClick={savePassword} disabled={!pwValid || pinSaving}
                className="flex-1 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                {pinSaving && <Loader2 size={14} className="animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
