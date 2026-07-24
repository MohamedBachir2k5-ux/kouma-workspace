import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { AuthService } from '../../services/auth.service'
import { UserService } from '../../services/user.service'
import { DepartmentService } from '../../services/department.service'
import { KeyService } from '../../services/key.service'
import type { Department } from '../../lib/types'

function PinInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={6}
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder={placeholder ?? '••••••'}
      disabled={disabled}
      className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-center text-xl font-mono tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
    />
  )
}

export function JoinOrg() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [invite, setInvite] = useState<{ organizationId: string } | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    departmentId: '',
    jobTitle: '',
    pin: '',
    confirmPin: '',
  })

  useEffect(() => {
    if (!token) { setLoadError('Lien d\'invitation invalide.'); return }
    UserService.getInviteByToken(token).then(async data => {
      if (!data) { setLoadError('Ce lien d\'invitation est invalide ou a expiré.'); return }
      setInvite(data)
      const depts = await DepartmentService.listByInviteToken(token)
      setDepartments(depts)
    })
  }, [token])

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const deptRequired = departments.length > 0
  const pinValid = /^\d{6}$/.test(form.pin) && form.pin === form.confirmPin
  const valid =
    form.email.trim().includes('@') &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.jobTitle.trim().length > 0 &&
    (!deptRequired || form.departmentId) &&
    pinValid

  async function handleSubmit() {
    if (!valid || !invite || !token) return
    setLoading(true)
    setError(null)

    const { userId, error: signUpError } = await AuthService.signUp({
      email: form.email.trim(),
      password: form.pin,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
    })

    if (signUpError || !userId) {
      setError(signUpError ?? 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }

    // Generate E2E key pair wrapped with PIN
    const { error: keyError } = await KeyService.generateAndStoreUserKeys(userId, form.pin)
    if (keyError) {
      setError('Erreur lors de la génération des clés de chiffrement.')
      setLoading(false)
      return
    }

    const { error: joinError } = await UserService.acceptInvite(token, userId, {
      departmentId: form.departmentId || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
    })

    if (joinError) {
      setError(joinError)
      setLoading(false)
      return
    }

    navigate('/connexion/utilisateur')
  }

  if (loadError) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-danger mb-4">{loadError}</p>
          <Link to="/" className="text-sm text-indigo hover:underline">Retour à l'accueil</Link>
        </div>
      </div>
    )
  }

  const ready = !!invite

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
            <h1 className="text-xl font-bold text-navy mb-1">Créer votre compte</h1>
            <p className="text-sm text-muted leading-relaxed">
              Vous avez été invité à rejoindre un espace de travail Kouma.
            </p>
          </div>

          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                Email professionnel *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="vous@organisation.com"
                autoFocus
                disabled={!ready}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
              />
            </div>

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Prénom *</label>
                <input
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  placeholder="Aminata"
                  disabled={!ready}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Nom *</label>
                <input
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  placeholder="Diallo"
                  disabled={!ready}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                Téléphone <span className="font-normal text-faint normal-case">(optionnel)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+224 620 00 00 00"
                disabled={!ready}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
              />
            </div>

            {/* Département */}
            {deptRequired && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                  Département *
                </label>
                <div className="relative">
                  <select
                    value={form.departmentId}
                    onChange={e => update('departmentId', e.target.value)}
                    disabled={!ready}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
                  >
                    <option value="">Sélectionner un département</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                </div>
              </div>
            )}

            {/* Fonction */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Fonction *</label>
              <input
                value={form.jobTitle}
                onChange={e => update('jobTitle', e.target.value)}
                placeholder="Chargé de mission, Analyste…"
                disabled={!ready}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
              />
            </div>

            {/* Code PIN */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                Code PIN * <span className="font-normal text-faint normal-case">(6 chiffres)</span>
              </label>
              <PinInput
                value={form.pin}
                onChange={v => update('pin', v)}
                disabled={!ready}
              />
              <p className="mt-1 text-[10px] text-faint">
                Ce code remplace le mot de passe pour accéder à votre espace collaborateur.
              </p>
            </div>

            {/* Confirmer PIN */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                Confirmer le code PIN *
              </label>
              <PinInput
                value={form.confirmPin}
                onChange={v => update('confirmPin', v)}
                placeholder={form.pin.length === 6 && form.confirmPin && form.pin !== form.confirmPin ? '——————' : '••••••'}
                disabled={!ready}
              />
              {form.confirmPin && form.pin !== form.confirmPin && (
                <p className="mt-1 text-xs text-danger">Les codes PIN ne correspondent pas.</p>
              )}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-danger text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!valid || loading || !ready}
            className="mt-6 w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? 'Création du compte…' : <><span>Créer mon compte</span><ArrowRight size={15} /></>}
          </button>

          <p className="mt-4 text-center text-xs text-faint leading-relaxed">
            En créant votre compte, vous acceptez les{' '}
            <Link to="/legal/cgu" className="text-indigo hover:underline">conditions d'utilisation</Link> de Kouma.
          </p>
        </div>
      </div>
    </div>
  )
}
