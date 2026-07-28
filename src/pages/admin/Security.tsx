import { useState, useEffect } from 'react'
import { Smartphone, Shield, LogOut, AlertTriangle, Clock, Loader2, Monitor, Tablet, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SessionService } from '../../services/session.service'
import type { SessionRecord } from '../../services/session.service'

type OrgSessionRecord = SessionRecord & { userEmail?: string; userName?: string }

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

function DeviceIcon({ platform }: { platform: string | null }) {
  if (!platform) return <Smartphone size={17} className="text-muted" />
  const p = platform.toLowerCase()
  if (p.includes('iphone') || p.includes('android')) return <Smartphone size={17} className="text-muted" />
  if (p.includes('ipad')) return <Tablet size={17} className="text-muted" />
  return <Monitor size={17} className="text-muted" />
}

export function AdminSecurity() {
  const { currentUser, currentOrg, currentSessionId } = useAuth()
  const [sessions, setSessions] = useState<OrgSessionRecord[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const SESSION_KEY = `session_duration_${currentUser.id}`
  const [sessionDuration, setSessionDuration] = useState(() => localStorage.getItem(SESSION_KEY) ?? '30')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    SessionService.listByOrg(currentOrg.id).then(data => {
      setSessions(data)
      setLoadingSessions(false)
    })
  }, [currentOrg.id])

  async function revokeSession(id: string) {
    setRevoking(id)
    await SessionService.revoke(id)
    setSessions(prev => prev.filter(s => s.id !== id))
    setRevoking(null)
  }

  function save() {
    localStorage.setItem(SESSION_KEY, sessionDuration)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Sécurité</h1>
        <p className="text-sm text-muted mt-0.5">Contrôle des accès et paramètres de sécurité du workspace.</p>
      </div>

      {/* Sessions actives */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-5">
        <div className="px-5 py-3.5 border-b border-border bg-bg flex items-center gap-2">
          <Smartphone size={16} className="text-muted" />
          <h2 className="text-sm font-bold text-ink">Sessions actives</h2>
          {!loadingSessions && (
            <span className="ml-auto text-xs text-faint">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loadingSessions ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">
            Aucune session active enregistrée.
          </div>
        ) : (
          sessions.map((s, idx) => {
            const isCurrent = s.id === currentSessionId
            return (
              <div key={s.id} className={`flex items-center gap-4 px-5 py-4 ${idx < sessions.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center shrink-0">
                  <DeviceIcon platform={s.platform} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-ink">{s.deviceName ?? 'Appareil inconnu'}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 bg-success/10 text-success text-[10px] font-semibold rounded-full">Session actuelle</span>
                    )}
                  </div>
                  {s.userName && (
                    <div className="flex items-center gap-1 text-xs text-indigo font-medium mb-0.5">
                      <User size={10} />
                      {s.userName}
                    </div>
                  )}
                  <div className="text-xs text-muted">{s.browser ?? '—'} · {s.platform ?? '—'}</div>
                  <div className="flex items-center gap-1 text-[10px] text-faint mt-0.5">
                    <Clock size={10} />
                    {formatRelative(s.lastSeenAt)}
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-danger/30 text-danger text-xs font-semibold rounded-lg hover:bg-danger/5 transition-colors shrink-0 disabled:opacity-40"
                  >
                    {revoking === s.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <LogOut size={13} />
                    }
                    Révoquer
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Security settings */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-5">
        <div className="px-5 py-3.5 border-b border-border bg-bg flex items-center gap-2">
          <Shield size={16} className="text-muted" />
          <h2 className="text-sm font-bold text-ink">Paramètres de sécurité</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-sm font-medium text-ink">Longueur du code PIN</div>
              <div className="text-xs text-muted">Code utilisé par les collaborateurs pour se connecter</div>
            </div>
            <select disabled
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-muted cursor-not-allowed">
              <option value="6">6 chiffres</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-sm font-medium text-ink">Durée de session</div>
              <div className="text-xs text-muted">Délai avant déconnexion automatique des collaborateurs</div>
            </div>
            <select value={sessionDuration} onChange={e => setSessionDuration(e.target.value)}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy">
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert zone */}
      <div className="bg-amber/5 border border-amber/20 rounded-xl p-5 mb-5 flex items-start gap-3">
        <AlertTriangle size={17} className="text-amber mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-ink mb-1">Zone sensible</p>
          <p className="text-xs text-muted leading-relaxed">
            La révocation d'un accès est immédiate et irréversible. L'utilisateur est déconnecté de tous ses appareils et perd l'accès au workspace. Utilisez la suspension pour une exclusion temporaire.
          </p>
        </div>
      </div>

      <button onClick={save}
        className={`px-5 py-3 text-sm font-semibold rounded-xl transition-colors ${saved ? 'bg-success text-white' : 'bg-navy text-white hover:bg-navy-light'}`}>
        {saved ? 'Enregistré' : 'Enregistrer les paramètres'}
      </button>
    </div>
  )
}
