import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { RecoveryService } from '../../services/recovery.service'

type Step = 'email' | 'otp' | 'pin' | 'done'

function PinInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="tel"
      inputMode="numeric"
      maxLength={6}
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder={placeholder ?? '••••••'}
      className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-center text-xl font-mono tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-indigo"
    />
  )
}

export function CollaboratorRecovery() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [userId, setUserId] = useState('')
  const [orgId, setOrgId] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

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
    setStep('pin')
  }

  async function resetPin() {
    if (pin.length !== 6 || pin !== confirmPin) return
    setLoading(true)
    setError(null)
    const { error: err } = await RecoveryService.collaboratorResetPin(userId, orgId, pin)
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
        <Link to="/connexion/utilisateur" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors">
          <ArrowLeft size={15} /> Retour à la connexion
        </Link>

        <div className="bg-surface rounded-2xl border border-border p-6">

          {step === 'email' && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-pale flex items-center justify-center">
                  <KeyRound size={18} className="text-indigo" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-navy">Code PIN oublié</h1>
                  <p className="text-xs text-muted">Réinitialisation par email</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-5">
                Un code de vérification sera envoyé à votre adresse professionnelle. Vous pourrez choisir un nouveau code PIN.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@organisation.com"
                  autoFocus
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={sendOtp}
                  disabled={!email.trim() || loading}
                  className="w-full py-3 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Envoi…' : 'Recevoir le code'}
                </button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">Code de vérification</h1>
              <p className="text-sm text-muted mb-5">
                Entrez le code à 6 chiffres envoyé à <strong className="text-ink">{email}</strong>.
              </p>
              <div className="space-y-3">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-center font-mono tracking-[1rem] placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={verifyOtp}
                  disabled={otp.length !== 6 || loading}
                  className="w-full py-3 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Vérification…' : 'Vérifier le code'}
                </button>
                <button onClick={() => { setStep('email'); setOtp(''); setError(null) }} className="w-full text-xs text-muted hover:text-ink transition-colors">
                  Renvoyer le code
                </button>
              </div>
            </>
          )}

          {step === 'pin' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">Nouveau code PIN</h1>
              <p className="text-xs text-muted leading-relaxed mb-5">
                Choisissez un nouveau code PIN à 6 chiffres.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Nouveau code PIN</label>
                  <PinInput value={pin} onChange={setPin} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Confirmer le code PIN</label>
                  <PinInput
                    value={confirmPin}
                    onChange={setConfirmPin}
                    placeholder={pin.length === 6 && confirmPin && pin !== confirmPin ? '——————' : '••••••'}
                  />
                  {confirmPin && pin !== confirmPin && (
                    <p className="mt-1 text-xs text-danger">Les codes PIN ne correspondent pas.</p>
                  )}
                </div>
                <div className="p-3 bg-amber/5 border border-amber/20 rounded-xl">
                  <p className="text-xs text-amber leading-relaxed">
                    Les messages précédemment chiffrés ne seront plus accessibles avec le nouveau code. Les nouveaux messages seront correctement chiffrés.
                  </p>
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={resetPin}
                  disabled={pin.length !== 6 || pin !== confirmPin || loading}
                  className="w-full py-3 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Réinitialisation…' : 'Réinitialiser mon code PIN'}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mx-auto mb-4">
                <KeyRound size={22} className="text-success" />
              </div>
              <h1 className="text-base font-bold text-navy mb-2">Code PIN réinitialisé</h1>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Vous pouvez maintenant vous connecter avec votre nouveau code PIN.
              </p>
              <button
                onClick={() => navigate('/connexion/utilisateur', { replace: true })}
                className="w-full py-3 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
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
