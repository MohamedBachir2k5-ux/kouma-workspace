import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Eye, EyeOff, ArrowRight } from 'lucide-react'

type Step = 'form' | 'success'

export function JoinOrg() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '' })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const valid = form.firstName.trim() && form.lastName.trim() &&
    form.password.length >= 8 && form.password === form.confirm

  async function handleSubmit() {
    if (!valid) return
    setLoading(true)
    // TODO: call AuthService.acceptInvitation(token, form) in Étape 3
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-success" />
          </div>
          <h1 className="text-xl font-bold text-navy mb-2">Compte créé avec succès</h1>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            Vous avez rejoint l'organisation. Connectez-vous pour accéder à votre espace de travail.
          </p>
          <Link to="/connexion/utilisateur"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
            Accéder à l'espace <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-navy mb-1">Rejoindre l'organisation</h1>
            <p className="text-sm text-muted leading-relaxed">
              Vous avez été invité à rejoindre un espace de travail Kouma. Créez votre compte pour continuer.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Prénom *</label>
                <input
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  placeholder="Aminata"
                  autoFocus
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Nom *</label>
                <input
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  placeholder="Diallo"
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                Mot de passe <span className="text-faint normal-case font-normal">(min. 8 caractères)</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Confirmer le mot de passe</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => update('confirm', e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 bg-bg border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
                  form.confirm && form.password !== form.confirm ? 'border-danger' : 'border-border'
                }`}
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="mt-1 text-xs text-danger">Les mots de passe ne correspondent pas.</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!valid || loading}
              className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-faint leading-relaxed">
            En créant votre compte, vous acceptez les{' '}
            <Link to="/legal/cgu" className="text-indigo hover:underline">conditions d'utilisation</Link> de Kouma.
          </p>
        </div>

        {token && (
          <p className="mt-4 text-center text-xs text-faint">
            Jeton d'invitation : <span className="font-mono text-muted">{token}</span>
          </p>
        )}
      </div>
    </div>
  )
}
