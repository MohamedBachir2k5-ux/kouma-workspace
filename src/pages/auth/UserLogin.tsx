import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ArrowLeft } from 'lucide-react'
import { AuthService } from '../../services/auth.service'
import { KeyService } from '../../services/key.service'
import { OrganizationService } from '../../services/organization.service'

export function UserLogin() {
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
      setError(`Trop de tentatives. Réessayez dans ${remaining} minute${remaining > 1 ? 's' : ''}.`)
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
        setError(`Trop de tentatives incorrectes. Compte bloqué pendant 15 minutes.`)
      } else {
        setError(`Code PIN ou email incorrect. (${next}/${MAX_ATTEMPTS} tentatives)`)
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
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
      </Link>

      <div className="w-full max-w-sm">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </Link>

        {step === 'email' ? (
          <form onSubmit={handleEmailNext}>
            <h1 className="text-2xl font-bold text-navy mb-1">Connexion</h1>
            <p className="text-muted text-sm mb-8">Entrez votre email professionnel.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                  Email professionnel
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
                Continuer
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={() => { setStep('email'); setPin(''); setError(null) }}
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors"
            >
              <ArrowLeft size={15} />
              Changer d'email
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-pale rounded-lg mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo" />
                <span className="text-indigo text-xs font-medium truncate max-w-[220px]">{email}</span>
              </div>
              <h1 className="text-2xl font-bold text-navy mb-1">Code PIN</h1>
              <p className="text-muted text-sm">Entrez votre code PIN à 6 chiffres.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                  Code PIN
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
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={pin.length !== 6 || loading}
                className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
              <p className="text-center text-xs text-faint">
                <Link to="/recuperation/utilisateur" className="text-indigo hover:underline">Code PIN oublié ?</Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
