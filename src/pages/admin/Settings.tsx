import { useState, useRef, useEffect } from 'react'
import { Building2, CreditCard, Bell, Camera, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { DocumentService } from '../../services/document.service'
import { UserService } from '../../services/user.service'
import { OrganizationService } from '../../services/organization.service'
import { PaymentService } from '../../services/payment.service'
import { PRICING, STORAGE, PLAN_USER_LIMITS, TRIAL_DAYS, discountedPrice, formatPrice } from '../../config/pricing'
import { formatFileSize, formatShortDate } from '../../lib/utils'
import type { SupportedCurrency } from '../../config/pricing'

function orgInitials(name: string) {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'
}

export function AdminSettings() {
  const { currentOrg, currentSubscription, updateCurrentOrg } = useAuth()

  const [orgForm, setOrgForm] = useState({
    name:    currentOrg.name,
    type:    currentOrg.sector ?? 'Secteur privé',
    country: currentOrg.country,
    city:    currentOrg.city ?? '',
    email:   currentOrg.email,
    phone:   currentOrg.phone ?? '',
    website: currentOrg.website ?? '',
  })
  const NOTIFS_KEY = `notif_prefs_${currentOrg.id}`
  const [logoPreview, setLogoPreview] = useState<string | null>(currentOrg.logoUrl)
  const [saved, setSaved] = useState(false)
  const [section, setSection] = useState<'org' | 'plan' | 'notifs'>('org')
  const [notifs, setNotifs] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIFS_KEY)
      return stored ? JSON.parse(stored) : { invites: true, storage: true, failures: false, upgrade: true }
    } catch {
      return { invites: true, storage: true, failures: false, upgrade: true }
    }
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  const currency = currentOrg.currency as SupportedCurrency
  const plan = currentSubscription.plan
  const planPrices = PRICING[currency][plan]
  const discounted = discountedPrice(planPrices.monthly, planPrices.discountPercent)
  const nextPlan = plan === 'free' ? 'business' : plan === 'business' ? 'enterprise' : null
  const otherPrices = nextPlan ? PRICING[currency][nextPlan] : null
  const otherDiscounted = otherPrices ? discountedPrice(otherPrices.monthly, otherPrices.discountPercent) : 0

  const [memberCount, setMemberCount] = useState(0)
  const [storageUsed, setStorageUsed] = useState(0)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const userLimit = PLAN_USER_LIMITS[plan]

  useEffect(() => {
    // Billing counts all non-deleted members (active + suspended) — Gundo bills per
    // authorized collaborator regardless of activity. getByOrganizationWithRole already
    // excludes status='deleted', so users.length is the billable seat count.
    UserService.getByOrganizationWithRole(currentOrg.id).then(users => {
      setMemberCount(users.filter(u => u.status === 'active' || u.status === 'suspended').length)
    })
    DocumentService.totalUsed(currentOrg.id).then(setStorageUsed)
  }, [currentOrg.id])

  function update(field: string, val: string) {
    setOrgForm(p => ({ ...p, [field]: val }))
    setSaved(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
    setSaved(false)
    const { logoUrl, error } = await OrganizationService.uploadLogo(currentOrg.id, file)
    if (!error && logoUrl) {
      setLogoPreview(logoUrl)
      updateCurrentOrg({ logoUrl })
    }
  }

  async function handleUpgrade() {
    setUpgrading(true)
    setUpgradeError(null)
    const target = nextPlan ?? 'enterprise'
    const { redirectUrl, error } = await PaymentService.upgradeSubscription(currentOrg.id, target, currency, true)
    setUpgrading(false)
    if (error) { setUpgradeError(error); return }
    if (redirectUrl) { window.location.href = redirectUrl; return }
    setUpgradeError('Le service de paiement est temporairement indisponible. Réessayez dans quelques instants.')
  }

  async function save() {
    const { error } = await OrganizationService.update(currentOrg.id, {
      name: orgForm.name,
      email: orgForm.email,
      phone: orgForm.phone || null,
      website: orgForm.website || null,
      city: orgForm.city || null,
      sector: orgForm.type || null,
    })
    if (!error) {
      updateCurrentOrg({ name: orgForm.name, email: orgForm.email, phone: orgForm.phone || undefined, website: orgForm.website || undefined, city: orgForm.city || undefined, sector: orgForm.type || undefined })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Paramètres</h1>
        <p className="text-sm text-muted mt-0.5">Configuration de votre workspace.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg rounded-xl border border-border mb-6 w-fit">
        {[
          { id: 'org',    label: 'Organisation', icon: Building2 },
          { id: 'plan',   label: 'Abonnement',   icon: CreditCard },
          { id: 'notifs', label: 'Notifications', icon: Bell },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSection(id as typeof section)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              section === id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {section === 'org' && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-sm font-bold text-ink">Informations de l'organisation</h2>

          {/* Logo */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-navy flex items-center justify-center shrink-0 overflow-hidden border border-border">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-xl">{orgInitials(orgForm.name)}</span>
                }
              </div>
              <div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm font-medium text-muted hover:bg-bg transition-colors">
                  <Camera size={14} /> Changer le logo
                </button>
                <p className="text-xs text-faint mt-1">JPG, PNG, SVG — max 2 Mo</p>
              </div>
            </div>
          </div>

          {[
            { field: 'name',    label: "Nom de l'organisation", placeholder: "Nom de votre organisation" },
            { field: 'email',   label: 'Email administrateur',  placeholder: 'admin@organisation.com' },
            { field: 'phone',   label: 'Téléphone',             placeholder: '+XX XXXX XXXX' },
            { field: 'website', label: 'Site web',              placeholder: 'https://www.organisation.com' },
            { field: 'city',    label: 'Ville',                 placeholder: 'Votre ville' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{label}</label>
              <input value={orgForm[field as keyof typeof orgForm]} onChange={e => update(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Secteur</label>
            <select value={orgForm.type} onChange={e => update('type', e.target.value)}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy appearance-none">
              {['Secteur privé', 'Secteur public', 'Organisation à but non lucratif', 'Autre'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Taille</label>
            <div className="flex items-center justify-between w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink">
              <span>{memberCount} collaborateur{memberCount > 1 ? 's' : ''}</span>
              <span className="text-xs text-faint">Calculée automatiquement</span>
            </div>
            <p className="text-xs text-faint mt-1">La taille évolue automatiquement selon le nombre réel d'utilisateurs.</p>
          </div>

          <button onClick={save}
            className={`mt-2 px-5 py-3 text-sm font-semibold rounded-xl transition-colors ${
              saved ? 'bg-success text-white' : 'bg-navy text-white hover:bg-navy-light'
            }`}>
            {saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      )}

      {section === 'plan' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ink">Plan actuel</h2>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-full capitalize">
                {currentSubscription.status === 'active' ? 'Actif' : currentSubscription.status}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-navy rounded-xl mb-4">
              <div>
                <div className="text-white font-bold text-lg capitalize">{plan}</div>
                <div className="text-indigo-light text-sm">
                  {userLimit ? `Jusqu'à ${userLimit} utilisateurs` : 'Utilisateurs illimités'} · {STORAGE[plan]}
                </div>
              </div>
              <div className="text-right">
                {planPrices.monthly === 0 ? (
                  <div className="text-white font-bold">Gratuit</div>
                ) : (
                  <>
                    <div className="text-indigo-light text-xs line-through">{formatPrice(planPrices.monthly, currency)}</div>
                    <div className="text-white font-bold">{formatPrice(discounted, currency)}</div>
                    <div className="text-indigo-light text-xs">par mois · −{planPrices.discountPercent}% lancement</div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex justify-between">
                <span>Collaborateurs</span>
                <span className="font-semibold text-ink">{memberCount}{userLimit ? ` / ${userLimit}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Stockage utilisé</span>
                <span className="font-semibold text-ink">{formatFileSize(storageUsed)} / {STORAGE[plan]}</span>
              </div>
              {currentSubscription.discountEndsAt && (
                <div className="flex justify-between">
                  <span>Remise de lancement</span>
                  <span className="font-semibold text-success">
                    −{currentSubscription.discountPercent}% · jusqu'au {formatShortDate(currentSubscription.discountEndsAt)}
                  </span>
                </div>
              )}
              {currentSubscription.renewsAt && (
                <div className="flex justify-between">
                  <span>Prochain prélèvement</span>
                  <span className="font-semibold text-ink">{formatShortDate(currentSubscription.renewsAt)}</span>
                </div>
              )}
            </div>
          </div>

          {nextPlan && otherPrices && (
            <div className="bg-surface rounded-xl border border-border p-6">
              <h2 className="text-sm font-bold text-ink mb-3">
                Passer au plan {nextPlan === 'business' ? 'Business' : 'Enterprise'}
              </h2>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                {nextPlan === 'business'
                  ? `Plus de ${userLimit} collaborateurs ou besoin de ${STORAGE.business} ? Le plan Business offre plus de capacité avec les mêmes fonctionnalités. Essai de ${TRIAL_DAYS} jours inclus.`
                  : `Plus de ${PLAN_USER_LIMITS.business} collaborateurs ou besoin de ${STORAGE.enterprise} ? Le plan Enterprise offre une capacité illimitée avec les mêmes fonctionnalités.`
                }
              </p>
              <div className="flex items-center justify-between p-4 bg-bg rounded-xl mb-4">
                <div>
                  <div className="font-bold text-navy capitalize">{nextPlan}</div>
                  <div className="text-xs text-muted">
                    {PLAN_USER_LIMITS[nextPlan] ? `Jusqu'à ${PLAN_USER_LIMITS[nextPlan]} utilisateurs` : 'Utilisateurs illimités'} · {STORAGE[nextPlan]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-faint line-through">{formatPrice(otherPrices.monthly, currency)}/mois</div>
                  <div className="font-bold text-navy">{formatPrice(otherDiscounted, currency)}/mois</div>
                  <div className="text-xs text-indigo">−{otherPrices.discountPercent}% première année</div>
                </div>
              </div>
              {upgradeError && (
                <p className="text-xs text-danger mb-3">{upgradeError}</p>
              )}
              <button onClick={handleUpgrade} disabled={upgrading}
                className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                {upgrading && <Loader2 size={15} className="animate-spin" />}
                {upgrading ? 'Redirection...' : `Passer au plan ${nextPlan === 'business' ? 'Business' : 'Enterprise'}`}
              </button>
            </div>
          )}
        </div>
      )}

      {section === 'notifs' && (
        <div>
        {notifSaved && <p className="text-xs text-success mb-3 px-1">Préférences enregistrées.</p>}
        <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
          {([
            { key: 'invites',  label: 'Nouveaux membres invités',     desc: "Notifier lorsqu'un membre accepte une invitation" },
            { key: 'storage',  label: 'Alertes de stockage',          desc: "Notifier à 80 % et 95 % de l'espace utilisé" },
            { key: 'failures', label: 'Connexions échouées',          desc: 'Alerter après 5 tentatives consécutives' },
            { key: 'upgrade',  label: 'Passage automatique Business', desc: `Notifier si l'équipe dépasse ${userLimit ?? 100} utilisateurs` },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-medium text-ink">{label}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
              <button type="button" onClick={() => {
                const next = { ...notifs, [key]: !notifs[key] }
                setNotifs(next)
                localStorage.setItem(NOTIFS_KEY, JSON.stringify(next))
                setNotifSaved(true)
                setTimeout(() => setNotifSaved(false), 1500)
              }}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${notifs[key] ? 'bg-success' : 'bg-border'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${notifs[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  )
}
