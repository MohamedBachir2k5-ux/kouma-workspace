import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react'
import { COUNTRIES } from '../../config/countries'
import { CURRENCY_LABELS } from '../../config/pricing'
import { AuthService } from '../../services/auth.service'
import { OrganizationService } from '../../services/organization.service'
import { KeyService } from '../../services/key.service'
import type { SupportedCurrency } from '../../config/pricing'

const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'fr'))

const steps = ['Votre organisation', 'Accès administrateur', 'Confirmation', 'Clé de récupération']

const orgTypes = [
  { value: 'prive', label: 'Secteur privé' },
  { value: 'public', label: 'Secteur public' },
  { value: 'npo', label: 'Organisation à but non lucratif' },
  { value: 'autre', label: 'Autre' },
]

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
]

function currencyNameForCountry(countryName: string): string {
  const found = COUNTRIES.find(c => c.name === countryName)
  if (!found) return ''
  return CURRENCY_LABELS[found.currency]
}

export function CreateOrg() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const countryRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [breakglassPhrase, setBreakglassPhrase] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [form, setForm] = useState({
    orgName: '', orgType: '', orgTypeOther: '',
    country: '', city: '', address: '', website: '',
    language: 'fr', currency: '',
    adminFirstName: '', adminLastName: '',
    email: '', emailSecondary: '', phone: '', phoneSecondary: '',
    password: '', confirmPassword: '',
  })
  const navigate = useNavigate()

  function update(field: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'country') {
        const found = COUNTRIES.find(c => c.name === value)
        next.currency = found?.currency ?? ''
      }
      return next
    })
  }

  function canNext(): boolean {
    if (step === 0) {
      return !!(form.orgName && form.orgType && form.country && form.city)
    }
    if (step === 1) {
      return !!(
        form.adminFirstName &&
        form.adminLastName &&
        form.email &&
        form.phone &&
        form.password.length >= 6 &&
        form.password === form.confirmPassword
      )
    }
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const { userId, error: signUpError } = await AuthService.signUp({
      email: form.email,
      password: form.password,
      firstName: form.adminFirstName,
      lastName: form.adminLastName,
      phone: form.phone || undefined,
      country: form.country || undefined,
      language: form.language,
    })

    if (signUpError || !userId) {
      setError(signUpError ?? 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }

    // Generate admin key pair (loads into CryptoSession)
    const { error: keyError } = await KeyService.generateAndStoreUserKeys(userId, form.password)
    if (keyError) {
      setError('Erreur lors de la génération des clés de chiffrement.')
      setLoading(false)
      return
    }

    const sectorLabel: Record<string, string> = {
      prive: 'Secteur privé', public: 'Secteur public',
      npo: 'Organisation à but non lucratif', autre: form.orgTypeOther || 'Autre',
    }

    const { organizationId, error: orgError } = await OrganizationService.create({
      name: form.orgName,
      email: form.email,
      phone: form.phone || undefined,
      website: form.website || undefined,
      country: form.country,
      currency: (form.currency || 'XOF') as SupportedCurrency,
      language: form.language,
      sector: sectorLabel[form.orgType] ?? form.orgType,
      adminUserId: userId,
    })

    if (orgError || !organizationId) {
      setError(orgError ?? 'Erreur lors de la création de l\'organisation.')
      setLoading(false)
      return
    }

    // Generate org recovery key pair + breakglass
    const { breakglassPhrase: phrase, error: recoveryError } = await KeyService.generateOrgRecoveryKeys(organizationId, userId)
    if (recoveryError) {
      setError('Erreur lors de la génération des clés de récupération.')
      setLoading(false)
      return
    }

    setBreakglassPhrase(phrase)
    setStep(3)
    setLoading(false)
  }

  const selectedType = orgTypes.find(t => t.value === form.orgType)
  const filteredCountries = SORTED_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countryQuery.toLowerCase())
  )

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Stepper */}
        <div className="flex items-center mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? 'bg-success text-white' : i === step ? 'bg-navy text-white' : 'bg-border text-muted'
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block transition-colors ${
                  i === step ? 'text-navy' : i < step ? 'text-success' : 'text-faint'
                }`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-colors ${i < step ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
          {/* ── STEP 1 ── */}
          {step === 0 && (
            <div>
              <h1 className="text-xl font-bold text-navy mb-1">Votre organisation</h1>
              <p className="text-muted text-sm mb-6">Décrivez votre structure pour personnaliser votre espace.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                    Nom de l'organisation *
                  </label>
                  <input
                    value={form.orgName}
                    onChange={e => update('orgName', e.target.value)}
                    placeholder="Nimba Industries SA"
                    autoFocus
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                    Type d'organisation *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {orgTypes.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => update('orgType', t.value)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors text-left ${
                          form.orgType === t.value
                            ? 'border-navy bg-navy text-white'
                            : 'border-border bg-bg text-muted hover:border-navy/30'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {form.orgType === 'autre' && (
                    <input
                      value={form.orgTypeOther}
                      onChange={e => update('orgTypeOther', e.target.value)}
                      placeholder="Précisez…"
                      className="mt-2 w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Pays *</label>
                    <div ref={countryRef} className="relative">
                      <input
                        value={countryOpen ? countryQuery : form.country}
                        onChange={e => setCountryQuery(e.target.value)}
                        onFocus={() => { setCountryOpen(true); setCountryQuery('') }}
                        onBlur={() => setTimeout(() => setCountryOpen(false), 150)}
                        placeholder="Rechercher un pays…"
                        className="w-full pl-3 pr-8 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                      />
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                      {countryOpen && (
                        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                          {filteredCountries.length === 0 ? (
                            <p className="text-xs text-faint text-center py-4">Aucun pays trouvé.</p>
                          ) : filteredCountries.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onMouseDown={() => {
                                update('country', c.name)
                                setCountryQuery('')
                                setCountryOpen(false)
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-bg ${
                                form.country === c.name ? 'text-navy font-semibold bg-navy/5' : 'text-ink'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Ville *</label>
                    <input
                      value={form.city}
                      onChange={e => update('city', e.target.value)}
                      placeholder="Conakry"
                      className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Langue de l'interface</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {languages.map(l => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => update('language', l.value)}
                          className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors ${
                            form.language === l.value
                              ? 'border-navy bg-navy text-white'
                              : 'border-border bg-bg text-muted hover:border-navy/30'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Devise</label>
                    <div className={`w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm ${form.currency ? 'text-ink' : 'text-faint'}`}>
                      {form.currency
                        ? currencyNameForCountry(form.country)
                        : 'Auto selon le pays'}
                    </div>
                    <p className="mt-1 text-[10px] text-faint">Définie automatiquement selon le pays.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Adresse</label>
                  <input
                    value={form.address}
                    onChange={e => update('address', e.target.value)}
                    placeholder="Quartier, rue, numéro…"
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                    Site web <span className="text-faint normal-case font-normal">(optionnel)</span>
                  </label>
                  <input
                    value={form.website}
                    onChange={e => update('website', e.target.value)}
                    placeholder="https://www.organisation.com"
                    type="url"
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-navy mb-1">Accès administrateur</h1>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                Ces identifiants permettront d'accéder à la console de gestion de votre organisation.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Prénom *</label>
                    <input
                      value={form.adminFirstName}
                      onChange={e => update('adminFirstName', e.target.value)}
                      placeholder="Mamadou"
                      autoFocus
                      className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Nom *</label>
                    <input
                      value={form.adminLastName}
                      onChange={e => update('adminLastName', e.target.value)}
                      placeholder="Diallo"
                      className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                    Email principal *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="admin@organisation.com"
                    autoFocus
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                    Email secondaire <span className="text-faint normal-case font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="email"
                    value={form.emailSecondary}
                    onChange={e => update('emailSecondary', e.target.value)}
                    placeholder="it@organisation.com"
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Téléphone *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="+224 620 00 00 00"
                      className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                      Tél. secondaire <span className="text-faint normal-case font-normal">(opt.)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phoneSecondary}
                      onChange={e => update('phoneSecondary', e.target.value)}
                      placeholder="+224 660 00 00 00"
                      className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">
                    Mot de passe <span className="text-faint normal-case font-normal">(min. 6 caractères)</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => update('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-bg border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-navy transition-all ${
                      form.confirmPassword && form.password !== form.confirmPassword ? 'border-danger' : 'border-border'
                    }`}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="mt-1.5 text-xs text-danger">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold text-navy mb-1">Confirmation</h1>
              <p className="text-muted text-sm mb-6">Vérifiez les informations avant de créer votre espace.</p>

              <div className="space-y-0 border border-border rounded-xl overflow-hidden mb-5">
                {[
                  { label: 'Organisation', value: form.orgName },
                  { label: 'Type', value: selectedType?.label || form.orgType },
                  { label: 'Pays', value: form.country },
                  { label: 'Ville', value: form.city },
                  { label: 'Langue', value: languages.find(l => l.value === form.language)?.label ?? form.language },
                  { label: 'Devise', value: currencyNameForCountry(form.country) || '—' },
                  { label: 'Administrateur', value: `${form.adminFirstName} ${form.adminLastName}` },
                  { label: 'Email administrateur', value: form.email },
                  { label: 'Téléphone', value: form.phone },
                ].map(({ label, value }, idx, arr) => (
                  <div key={label} className={`flex items-center justify-between px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</span>
                    <span className="text-sm font-medium text-ink">{value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-pale rounded-xl">
                <p className="text-xs text-indigo leading-relaxed">
                  En créant votre espace, vous acceptez que Kouma stocke les données nécessaires au fonctionnement de votre workspace. Vos contenus vous appartiennent.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Breakglass phrase ── */}
          {step === 3 && breakglassPhrase && (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg mb-5">
                <span className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Clé de récupération d'urgence</span>
              </div>
              <h1 className="text-xl font-bold text-navy mb-2">Notez votre phrase de récupération</h1>
              <p className="text-sm text-muted leading-relaxed mb-6">
                Cette phrase est affichée <strong>une seule fois</strong>. Elle vous permet de récupérer l'accès à votre organisation en cas d'urgence. Conservez-la dans un endroit sûr, hors ligne.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 text-center">
                <p className="font-mono text-sm tracking-widest text-amber-900 break-all select-all">{breakglassPhrase}</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 accent-navy"
                />
                <span className="text-sm text-ink leading-relaxed">
                  J'ai noté cette phrase en lieu sûr et je comprends qu'elle ne sera plus affichée.
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          {error && <p className="mt-4 text-sm text-center text-danger">{error}</p>}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => step > 0 && step < 3 ? setStep(step - 1) : null}
              className={`inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors ${step === 0 || step === 3 ? 'invisible' : ''}`}
            >
              <ArrowLeft size={15} />
              Précédent
            </button>

            {step === 3 ? (
              <button
                type="button"
                onClick={() => navigate('/admin/tableau-de-bord')}
                disabled={!confirmed}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-success text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Accéder à mon espace <ArrowRight size={15} />
              </button>
            ) : step < 2 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-success text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Création…' : 'Créer mon espace'}
                {!loading && <Check size={15} />}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Déjà un espace ?{' '}
          <Link to="/connexion" className="text-indigo font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
