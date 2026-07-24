import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { AuthService } from '../../services/auth.service'
import { KeyService } from '../../services/key.service'
import { OrganizationService } from '../../services/organization.service'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 4) return
    setLoading(true)
    setError(null)

    const { userId, error: authError } = await AuthService.signIn({ email, password })
    if (authError || !userId) {
      setError(authError ?? 'Identifiants incorrects.')
      setLoading(false)
      return
    }

    // Load E2E keys into session (best-effort — don't block login if missing)
    const orgRow = await OrganizationService.getForUser(userId)
    if (orgRow) {
      await KeyService.loadUserKeys(userId, password, orgRow.id)
    }

    navigate('/admin/tableau-de-bord', { replace: true })
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
        <Link to="/connexion" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 transition-colors">
          <ArrowLeft size={15} />
          Retour
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-navy/5 rounded-lg mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-navy" />
            <span className="text-navy text-xs font-semibold uppercase tracking-wide">Espace administrateur</span>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-1">Console d'administration</h1>
          <p className="text-muted text-sm">Connectez-vous avec les identifiants de votre organisation.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
              Email de l'organisation
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@organisation.com"
              required
              autoFocus
              className="w-full px-4 py-3.5 bg-surface border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={4}
                className="w-full px-4 py-3.5 pr-11 bg-surface border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink transition-colors"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Accéder à la console'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-faint">
          <Link to="/recuperation/admin" className="text-indigo hover:underline">Mot de passe oublié ?</Link>
        </p>
      </div>
    </div>
  )
}
