import { useState } from 'react'
import { Smartphone, Shield, LogOut, AlertTriangle, Clock } from 'lucide-react'

const mockSessions = [
  { id: 's1', device: 'iPhone 14 Pro', browser: 'Safari', location: 'Conakry, Guinée', lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(), current: true },
  { id: 's2', device: 'MacBook Pro', browser: 'Chrome', location: 'Conakry, Guinée', lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), current: false },
]

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

export function AdminSecurity() {
  const [sessions, setSessions] = useState(mockSessions)
  const [sessionDuration, setSessionDuration] = useState('30')
  const [pinLength] = useState('6')
  const [saved, setSaved] = useState(false)

  function revokeSession(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  function save() {
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
          <h2 className="text-sm font-bold text-ink">Sessions administrateur actives</h2>
        </div>
        {sessions.map((s, idx) => (
          <div key={s.id} className={`flex items-center gap-4 px-5 py-4 ${idx < sessions.length - 1 ? 'border-b border-border' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center shrink-0">
              <Smartphone size={17} className="text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-ink">{s.device}</span>
                {s.current && (
                  <span className="px-1.5 py-0.5 bg-success/10 text-success text-[10px] font-semibold rounded-full">Session actuelle</span>
                )}
              </div>
              <div className="text-xs text-muted">{s.browser} · {s.location}</div>
              <div className="flex items-center gap-1 text-[10px] text-faint mt-0.5">
                <Clock size={10} />
                {formatRelative(s.lastActive)}
              </div>
            </div>
            {!s.current && (
              <button onClick={() => revokeSession(s.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-danger/30 text-danger text-xs font-semibold rounded-lg hover:bg-danger/5 transition-colors shrink-0">
                <LogOut size={13} /> Révoquer
              </button>
            )}
          </div>
        ))}
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
            <select value={pinLength} disabled
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
