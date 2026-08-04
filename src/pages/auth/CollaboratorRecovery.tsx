import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [otpLockedUntil, setOtpLockedUntil] = useState<number | null>(null)

  const OTP_MAX = 5
  const OTP_LOCKOUT_MS = 2 * 60 * 1000

  async function sendOtp() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error: err } = await RecoveryService.sendRecoveryOtp(email.trim())
    setLoading(false)
    if (err) { setError(err); return }
    setOtpAttempts(0)
    setOtpLockedUntil(null)
    setStep('otp')
  }

  async function verifyOtp() {
    if (otp.length !== 6) return

    if (otpLockedUntil && Date.now() < otpLockedUntil) {
      const remaining = Math.ceil((otpLockedUntil - Date.now()) / 60000)
      setError(t('auth.tooManyAttempts', { minutes: remaining }))
      return
    }

    setLoading(true)
    setError(null)
    const { userId: uid, error: err } = await RecoveryService.verifyOtp(email.trim(), otp.trim())
    if (err || !uid) {
      const next = otpAttempts + 1
      setOtpAttempts(next)
      if (next >= OTP_MAX) {
        setOtpLockedUntil(Date.now() + OTP_LOCKOUT_MS)
        setError(t('auth.otpLocked'))
      } else {
        setError(err ?? t('auth.invalidCode', { count: String(next), max: String(OTP_MAX) }))
      }
      setLoading(false)
      return
    }

    const oid = await RecoveryService.getOrgIdForUser(uid)
    if (!oid) { setError(t('auth.orgNotFound')); setLoading(false); return }

    setUserId(uid)
    setOrgId(oid)
    setLoading(false)
    setStep('pin')
  }

  function isWeakPin(p: string): boolean {
    if (/^(\d)\1{5}$/.test(p)) return true
    const d = p.split('').map(Number)
    let asc = true, desc = true
    for (let i = 1; i < d.length; i++) {
      if (d[i] !== d[i-1] + 1) asc = false
      if (d[i] !== d[i-1] - 1) desc = false
    }
    return asc || desc
  }

  async function resetPin() {
    if (pin.length !== 6 || pin !== confirmPin) return
    if (isWeakPin(pin)) { setError(t('auth.pinTooSimple')); return }
    setLoading(true)
    setError(null)
    const { error: err } = await RecoveryService.collaboratorResetPin(userId, orgId, pin)
    setLoading(false)
    if (err) { setError(err); return }
    setStep('done')
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12 safe-area-bottom">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
      </Link>

      <div className="w-full max-w-sm">
        <Link to="/connexion/utilisateur" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors min-h-[44px]">
          <ArrowLeft size={15} /> {t('auth.backToLogin')}
        </Link>

        <div className="bg-surface rounded-2xl border border-border p-6">

          {step === 'email' && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-pale flex items-center justify-center">
                  <KeyRound size={18} className="text-indigo" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-navy">{t('auth.forgotPinTitle')}</h1>
                  <p className="text-xs text-muted">{t('auth.forgotPinSubtitle')}</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-5">
                {t('auth.forgotPinDesc')}
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
                  className="w-full py-3.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? t('auth.sending') : t('auth.sendCode')}
                </button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">{t('auth.otpTitle')}</h1>
              <p className="text-sm text-muted mb-5">
                {t('auth.otpDesc', { email })}
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
                  className="w-full py-3.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? t('auth.verifying') : t('auth.verifyCode')}
                </button>
                <button onClick={() => { setStep('email'); setOtp(''); setError(null) }} className="w-full min-h-[44px] text-xs text-muted hover:text-ink transition-colors">
                  {t('auth.resendCode')}
                </button>
              </div>
            </>
          )}

          {step === 'pin' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">{t('auth.newPin')}</h1>
              <p className="text-xs text-muted leading-relaxed mb-5">
                {t('auth.newPinSubtitle')}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('auth.newPin')}</label>
                  <PinInput value={pin} onChange={setPin} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('auth.confirmPin')}</label>
                  <PinInput
                    value={confirmPin}
                    onChange={setConfirmPin}
                    placeholder={pin.length === 6 && confirmPin && pin !== confirmPin ? '......' : '••••••'}
                  />
                  {confirmPin && pin !== confirmPin && (
                    <p className="mt-1 text-xs text-danger">{t('auth.pinMismatch')}</p>
                  )}
                </div>
                <div className="p-3 bg-amber/5 border border-amber/20 rounded-xl">
                  <p className="text-xs text-amber leading-relaxed">
                    {t('auth.pinResetWarning')}
                  </p>
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={resetPin}
                  disabled={pin.length !== 6 || pin !== confirmPin || loading}
                  className="w-full py-3.5 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? t('auth.resetting') : t('auth.resetPin')}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mx-auto mb-4">
                <KeyRound size={22} className="text-success" />
              </div>
              <h1 className="text-base font-bold text-navy mb-2">{t('auth.pinReset')}</h1>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                {t('auth.pinResetDesc')}
              </p>
              <button
                onClick={() => navigate('/connexion/utilisateur', { replace: true })}
                className="w-full py-3 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                {t('auth.login')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
