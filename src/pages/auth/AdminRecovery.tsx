import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { RecoveryService } from '../../services/recovery.service'

type Step = 'email' | 'otp' | 'credentials' | 'done'

export function AdminRecovery() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [userId, setUserId] = useState('')
  const [orgId, setOrgId] = useState('')
  const [phrase, setPhrase] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function sendOtp() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error: err } = await RecoveryService.sendRecoveryOtp(email.trim())
    setLoading(false)
    if (err) { setError(err); return }
    setStep('otp')
  }

  async function verifyOtp() {
    if (otp.length !== 6) return
    setLoading(true)
    setError(null)
    const { userId: uid, error: err } = await RecoveryService.verifyOtp(email.trim(), otp.trim())
    if (err || !uid) { setError(err ?? 'Code invalide.'); setLoading(false); return }

    const oid = await RecoveryService.getOrgIdForUser(uid)
    if (!oid) { setError('Organisation introuvable pour ce compte.'); setLoading(false); return }

    setUserId(uid)
    setOrgId(oid)
    setLoading(false)
    setStep('credentials')
  }

  async function runRecovery() {
    if (!phrase.trim() || password.length < 6 || password !== confirmPassword) return
    setLoading(true)
    setError(null)
    const { error: err } = await RecoveryService.adminBreakglassRecovery(orgId, userId, phrase.trim(), password)
    setLoading(false)
    if (err) { setError(err); return }
    setStep('done')
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
      </Link>

      <div className="w-full max-w-sm">
        <Link to="/connexion/admin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors">
          <ArrowLeft size={15} /> Retour à la connexion
        </Link>

        <div className="bg-surface rounded-2xl border border-border p-6">

          {/* Step: email */}
          {step === 'email' && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber/10 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-amber" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-navy">Récupération admin</h1>
                  <p className="text-xs text-muted">Via la phrase de récupération d'urgence</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-5">
                Un code de vérification sera envoyé à votre adresse email. Vous aurez besoin de votre <strong className="text-ink">phrase de récupération breakglass</strong>.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@organisation.com"
                  autoFocus
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={sendOtp}
                  disabled={!email.trim() || loading}
                  className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Envoi…' : 'Recevoir le code'}
                </button>
              </div>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">Code de vérification</h1>
              <p className="text-sm text-muted mb-5">Entrez le code à 6 chiffres envoyé à <strong className="text-ink">{email}</strong>.</p>
              <div className="space-y-3">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-center font-mono tracking-[1rem] placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={verifyOtp}
                  disabled={otp.length !== 6 || loading}
                  className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Vérification…' : 'Vérifier le code'}
                </button>
                <button onClick={() => { setStep('email'); setOtp(''); setError(null) }} className="w-full text-xs text-muted hover:text-ink transition-colors">
                  Renvoyer le code
                </button>
              </div>
            </>
          )}

          {/* Step: phrase + new password */}
          {step === 'credentials' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">Phrase & nouveau mot de passe</h1>
              <p className="text-xs text-muted leading-relaxed mb-5">
                Entrez votre phrase de récupération breakglass et choisissez un nouveau mot de passe.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                    Phrase de récupération
                  </label>
                  <input
                    type="text"
                    value={phrase}
                    onChange={e => setPhrase(e.target.value)}
                    placeholder="xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx"
                    autoFocus
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm font-mono text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full px-4 py-3 pr-11 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-bg border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy ${confirmPassword && password !== confirmPassword ? 'border-danger' : 'border-border'}`}
                  />
                </div>
                {error && <p className="text-xs text-danger bg-danger/5 px-3 py-2 rounded-lg">{error}</p>}
                <button
                  onClick={runRecovery}
                  disabled={!phrase.trim() || password.length < 6 || password !== confirmPassword || loading}
                  className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Récupération en cours…' : 'Récupérer mon accès'}
                </button>
              </div>
            </>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mx-auto mb-4">
                <ShieldCheck size={22} className="text-success" />
              </div>
              <h1 className="text-base font-bold text-navy mb-2">Accès récupéré</h1>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Votre compte a été restauré. Connectez-vous avec votre nouveau mot de passe.
              </p>
              <button
                onClick={() => navigate('/connexion/admin', { replace: true })}
                className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
