import { useState, useRef, useEffect } from 'react'
import { Bell, Smartphone, LogOut, Moon, X, Check, Camera, KeyRound, Monitor, Tablet, Loader2, Sun, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { UserService } from '../../services/user.service'
import { AuthService } from '../../services/auth.service'
import { KeyService } from '../../services/key.service'
import { SessionService } from '../../services/session.service'
import type { SessionRecord } from '../../services/session.service'
import { Avatar } from '../../components/ui/Avatar'
import i18n from '../../i18n/index'

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
]

type Tab = 'moi' | 'securite' | 'preferences'

const TABS: { value: Tab; label: string }[] = [
  { value: 'moi',         label: 'Moi' },
  { value: 'securite',    label: 'Sécurité' },
  { value: 'preferences', label: 'Préférences' },
]

function DeviceIcon({ platform }: { platform: string | null }) {
  if (!platform) return <Smartphone size={17} className="text-indigo" />
  const p = platform.toLowerCase()
  if (p.includes('ios') || p.includes('android')) return <Smartphone size={17} className="text-indigo" />
  if (p.includes('ipad')) return <Tablet size={17} className="text-indigo" />
  return <Monitor size={17} className="text-indigo" />
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

export function Profile() {
  const { currentUser, currentOrg, currentSessionId, signOut } = useAuth()
  const photoRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('moi')
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentUser.avatarUrl ?? null)
  const [editing, setEditing] = useState(false)
  const [changingPin, setChangingPin] = useState(false)
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

  // Sessions
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  // Preferences
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('kouma_theme') as 'light' | 'dark') ?? 'light'
  )
  const [notifEnabled, setNotifEnabled] = useState(() => Notification.permission === 'granted')

  useEffect(() => {
    if (tab === 'securite' && sessions.length === 0) {
      setSessionsLoading(true)
      SessionService.list(currentUser.id).then(data => {
        setSessions(data)
        setSessionsLoading(false)
      })
    }
  }, [tab, currentUser.id, sessions.length])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
    const { avatarUrl, error } = await UserService.uploadAvatar(currentUser.id, currentOrg.id, file)
    if (!error && avatarUrl) setPhotoPreview(avatarUrl)
  }

  function openEdit() { setDraft(profile); setEditing(true) }

  async function saveEdit() {
    await UserService.updateProfile(currentUser.id, {
      firstname: draft.firstName,
      lastname: draft.lastName,
      phone: draft.phone || null,
      language: draft.language,
    })
    setProfile(draft)
    if (draft.language !== i18n.language) i18n.changeLanguage(draft.language)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function savePassword() {
    setPwError(null)
    const { error } = await AuthService.updatePassword(pwForm.next)
    if (error) { setPwError(error); return }
    const { error: keyError } = await KeyService.rewrapPrivateKey(currentUser.id, pwForm.next)
    if (keyError) { setPwError("Code PIN mis à jour, mais la clé n'a pas pu être re-chiffrée. Reconnectez-vous."); return }
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
    if (notifEnabled) {
      setNotifEnabled(false)
    } else {
      const perm = await Notification.requestPermission()
      setNotifEnabled(perm === 'granted')
    }
  }

  const pwValid = /^\d{6}$/.test(pwForm.current) && /^\d{6}$/.test(pwForm.next) && pwForm.next === pwForm.confirm

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 max-w-xl">

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative shrink-0">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            {photoPreview
              ? <img src={photoPreview} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
              : <Avatar firstName={profile.firstName} lastName={profile.lastName} id={currentUser.id} size="xl" />
            }
            <button onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo rounded-full flex items-center justify-center border-2 border-surface hover:bg-indigo/90 transition-colors">
              <Camera size={11} className="text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-navy">{profile.firstName} {profile.lastName}</h2>
            <p className="text-xs text-muted">{currentUser.jobTitle ?? (currentUser.role === 'admin' ? 'Administrateur' : 'Collaborateur')}</p>
            <p className="text-xs text-faint mt-0.5">{currentUser.email}</p>
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
                <div className="text-xs text-muted mb-0.5">Organisation</div>
                <div className="text-sm font-semibold text-ink">{currentOrg.name}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-xs text-muted mb-0.5">Département</div>
                <div className="text-sm font-semibold text-ink">{currentUser.department ?? '—'}</div>
              </div>
              {currentUser.jobTitle && (
                <div className="px-4 py-3">
                  <div className="text-xs text-muted mb-0.5">Fonction</div>
                  <div className="text-sm font-semibold text-ink">{currentUser.jobTitle}</div>
                </div>
              )}
              <div className="px-4 py-3">
                <div className="text-xs text-muted mb-0.5">Téléphone</div>
                <div className="text-sm font-semibold text-ink">{profile.phone || '—'}</div>
              </div>
            </div>

            <button onClick={openEdit}
              className={`w-full py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                saved ? 'border-success/30 bg-success/5 text-success' : 'border-border text-muted hover:bg-bg'
              }`}>
              {saved
                ? <span className="flex items-center justify-center gap-2"><Check size={14} /> Profil mis à jour</span>
                : 'Modifier le profil'}
            </button>

            <button onClick={signOut}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-danger/5 border border-danger/20 rounded-xl text-danger text-sm font-medium hover:bg-danger/10 transition-colors">
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        )}

        {/* ── TAB SÉCURITÉ ── */}
        {tab === 'securite' && (
          <div className="space-y-4">
            {/* PIN change */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">Code PIN</h3>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <button onClick={() => setChangingPin(true)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                    <KeyRound size={16} className="text-indigo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${pwSaved ? 'text-success' : 'text-ink'}`}>
                      {pwSaved ? 'Code PIN mis à jour ✓' : 'Modifier mon code PIN'}
                    </div>
                    <div className="text-xs text-muted">Changer votre code PIN de connexion</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Active sessions */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Appareils connectés</h3>
                {sessions.filter(s => !s.isCurrent).length > 0 && (
                  <button onClick={revokeAllOthers} className="text-xs text-danger hover:underline">
                    Déconnecter les autres
                  </button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-faint" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted bg-surface rounded-xl border border-border">
                  Aucune session active.
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
                          <span className="text-sm font-medium text-ink truncate">{s.deviceName ?? 'Appareil inconnu'}</span>
                          {s.isCurrent && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-success/10 text-success rounded-full shrink-0">
                              Cet appareil
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">{s.browser} · {formatRelative(s.lastSeenAt)}</div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => revokeSession(s.id)}
                          disabled={revoking === s.id}
                          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                          title="Déconnecter"
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
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">Notifications</h3>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <button onClick={toggleNotifications}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                    <Bell size={16} className="text-indigo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">Notifications push</div>
                    <div className="text-xs text-muted">
                      {notifEnabled ? 'Activées — vous recevez des alertes' : 'Désactivées — cliquez pour autoriser'}
                    </div>
                  </div>
                  <div className={`w-10 h-5.5 rounded-full transition-colors flex items-center px-0.5 ${notifEnabled ? 'bg-indigo' : 'bg-border'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">Apparence</h3>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <button onClick={toggleTheme}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-bg transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                    {theme === 'light' ? <Sun size={16} className="text-indigo" /> : <Moon size={16} className="text-indigo" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">Thème {theme === 'light' ? 'clair' : 'sombre'}</div>
                    <div className="text-xs text-muted">Cliquez pour basculer vers le thème {theme === 'light' ? 'sombre' : 'clair'}</div>
                  </div>
                  <div className={`w-10 h-5.5 rounded-full transition-colors flex items-center px-0.5 ${theme === 'dark' ? 'bg-indigo' : 'bg-border'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">Langue</h3>
              <div className="grid grid-cols-2 gap-2">
                {languages.map(l => (
                  <button key={l.value} type="button"
                    onClick={() => { i18n.changeLanguage(l.value); setProfile(p => ({ ...p, language: l.value })); UserService.updateProfile(currentUser.id, { language: l.value }) }}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      i18n.language === l.value ? 'border-navy bg-navy text-white' : 'border-border bg-surface text-muted hover:border-navy/30 hover:bg-bg'
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-faint mt-6">Kouma v1.0</p>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-navy">Modifier le profil</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Prénom</label>
                  <input value={draft.firstName} onChange={e => setDraft(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Nom</label>
                  <input value={draft.lastName} onChange={e => setDraft(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Email</label>
                <input value={currentUser.email} disabled
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-faint cursor-not-allowed" />
                <p className="mt-1 text-[10px] text-faint">La modification de l'email nécessite une vérification.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Téléphone</label>
                <input type="tel" value={draft.phone} onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+XX XXXX XXXX"
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
              <button onClick={saveEdit} disabled={!draft.firstName.trim() || !draft.lastName.trim()}
                className="flex-1 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN modal */}
      {changingPin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setChangingPin(false)}>
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-navy">Modifier mon code PIN</h3>
              <button onClick={() => setChangingPin(false)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { field: 'current', label: 'PIN actuel',                placeholder: '••••••' },
                { field: 'next',    label: 'Nouveau PIN',               placeholder: '6 chiffres' },
                { field: 'confirm', label: 'Confirmer le nouveau PIN',  placeholder: '••••••' },
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
              <button onClick={() => setChangingPin(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
              <button onClick={savePassword} disabled={!pwValid}
                className="flex-1 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
