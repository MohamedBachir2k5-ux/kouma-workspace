import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthService } from '../../services/auth.service'
import { KeyService } from '../../services/key.service'
import { OrganizationService } from '../../services/organization.service'

export function UserLogin() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'email' | 'pin'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failCount, setFailCount] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const navigate = useNavigate()

  const MAX_ATTEMPTS = 5
  const LOCKOUT_MS = 15 * 60 * 1000

  function handleEmailNext(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) { setStep('pin'); setFailCount(0); setLockedUntil(null) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 6) return

    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 60000)
      setError(t('auth.tooManyAttempts', { minutes: remaining }))
      return
    }

    setLoading(true)
    setError(null)

    const { userId, error: authError } = await AuthService.signIn({ email, password: pin })
    if (authError || !userId) {
      const next = failCount + 1
      setFailCount(next)
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        setError(t('auth.accountLocked'))
      } else {
        setError(t('auth.wrongPin', { count: String(next), max: String(MAX_ATTEMPTS) }))
      }
      setLoading(false)
      return
    }

    // Load E2E keys into session (best-effort — don't block login if missing)
    const orgRow = await OrganizationService.getForUser(userId)
    if (orgRow) {
      await KeyService.loadUserKeys(userId, pin, orgRow.id)
    }

    navigate('/app/messages', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12 safe-area-bottom">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
      </Link>

      <div className="w-full max-w-sm">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6 transition-colors min-h-[44px]"
        >
          <ArrowLeft size={15} />
          {t('common.back')}
        </Link>

        {step === 'email' ? (
          <form onSubmit={handleEmailNext}>
            <h1 className="text-2xl font-bold text-navy mb-1">{t('auth.loginTitle')}</h1>
            <p className="text-muted text-sm mb-8">{t('auth.loginSubtitle')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                  {t('auth.professionalEmail')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@organisation.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 bg-surface border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy-light transition-colors"
              >
                {t('auth.continue')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={() => { setStep('email'); setPin(''); setError(null) }}
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors min-h-[44px]"
            >
              <ArrowLeft size={15} />
              {t('auth.changeEmail')}
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-pale rounded-lg mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo" />
                <span className="text-indigo text-xs font-medium truncate max-w-[220px]">{email}</span>
              </div>
              <h1 className="text-2xl font-bold text-navy mb-1">{t('auth.pinTitle')}</h1>
              <p className="text-muted text-sm">{t('auth.pinSubtitle')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                  {t('auth.pinLabel')}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 bg-surface border border-border rounded-xl text-sm text-ink text-center tracking-[1rem] font-mono placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <p className="text-xs text-danger bg-danger/5 border border-danger/20 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={pin.length !== 6 || loading}
                className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? t('auth.connecting') : t('auth.login')}
              </button>
              <Link to="/recuperation/utilisateur" className="flex items-center justify-center min-h-[44px] text-xs text-indigo hover:underline">
                {t('auth.forgotPin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
