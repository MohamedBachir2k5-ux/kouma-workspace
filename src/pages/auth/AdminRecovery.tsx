import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RecoveryService } from '../../services/recovery.service'

type Step = 'email' | 'otp' | 'credentials' | 'done'

function getDeviceInfo(): string {
  const ua = navigator.userAgent
  const mobile = /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop'
  const browser = /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Navigateur'
  return `${browser} · ${mobile}`
}

export function AdminRecovery() {
  const { t } = useTranslation()
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
    RecoveryService.logRecoveryInitiated(uid, oid)
    setLoading(false)
    setStep('credentials')
  }

  async function runRecovery() {
    if (!phrase.trim() || password.length < 6 || password !== confirmPassword) return
    setLoading(true)
    setError(null)
    const { error: err } = await RecoveryService.adminBreakglassRecovery(orgId, userId, phrase.trim(), password, getDeviceInfo())
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
          <ArrowLeft size={15} /> {t('auth.backToLogin')}
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
                  <h1 className="text-base font-bold text-navy">{t('auth.adminRecoveryTitle')}</h1>
                  <p className="text-xs text-muted">{t('auth.adminRecoverySubtitle')}</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-5">
                {t('auth.adminRecoveryDesc')}
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
                  {loading ? t('auth.sending') : t('auth.sendCode')}
                </button>
              </div>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">{t('auth.otpTitle')}</h1>
              <p className="text-sm text-muted mb-5">{t('auth.otpDesc', { email })}</p>
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
                  {loading ? t('auth.verifying') : t('auth.verifyCode')}
                </button>
                <button onClick={() => { setStep('email'); setOtp(''); setError(null) }} className="w-full text-xs text-muted hover:text-ink transition-colors">
                  {t('auth.resendCode')}
                </button>
              </div>
            </>
          )}

          {/* Step: phrase + new password */}
          {step === 'credentials' && (
            <>
              <h1 className="text-base font-bold text-navy mb-1">{t('auth.phraseAndPassword')}</h1>
              <p className="text-xs text-muted leading-relaxed mb-5">
                {t('auth.phraseAndPasswordDesc')}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                    {t('auth.recoveryPhrase')}
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
                    {t('auth.newPassword')}
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
                    {t('auth.confirmPassword')}
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
                  {loading ? t('auth.recovering') : t('auth.recoverAccess')}
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
              <h1 className="text-base font-bold text-navy mb-2">{t('auth.accessRecovered')}</h1>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                {t('auth.accessRecoveredDesc')}
              </p>
              <button
                onClick={() => navigate('/connexion/admin', { replace: true })}
                className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
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
