import { useState, useRef } from 'react'
import { Building2, CreditCard, Bell, Camera } from 'lucide-react'
import { mockOrgUsers } from '../../lib/mock'
import { useAuth } from '../../contexts/AuthContext'
import { DocumentService } from '../../services/document.service'
import { PRICING, STORAGE, STORAGE_BYTES, PLAN_USER_LIMITS, TRIAL_DAYS, discountedPrice, formatPrice } from '../../config/pricing'
import { formatFileSize, formatShortDate } from '../../lib/utils'
import type { SupportedCurrency } from '../../config/pricing'

function orgInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function AdminSettings() {
  const { currentOrg, currentSubscription } = useAuth()

  const [orgForm, setOrgForm] = useState({
    name:    currentOrg.name,
    type:    currentOrg.sector ?? 'Secteur privé',
    country: currentOrg.country,
    city:    currentOrg.city ?? '',
    email:   currentOrg.email,
    phone:   currentOrg.phone ?? '',
    website: currentOrg.website ?? '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [section, setSection] = useState<'org' | 'plan' | 'notifs'>('org')
  const [notifs, setNotifs] = useState({
    invites:  true,
    storage:  true,
    failures: false,
    upgrade:  true,
  })
  const logoRef = useRef<HTMLInputElement>(null)

  const currency = currentOrg.currency as SupportedCurrency
  const plan = currentSubscription.plan
  const planPrices = PRICING[currency][plan]
  const discounted = discountedPrice(planPrices.monthly, planPrices.discountPercent)
  const otherPlan = plan === 'starter' ? 'business' : 'starter'
  const otherPrices = PRICING[currency][otherPlan]
  const otherDiscounted = discountedPrice(otherPrices.monthly, otherPrices.discountPercent)

  const activeCount   = mockOrgUsers.filter(u => u.organizationId === currentOrg.id && u.status === 'active').length
  const storageUsed   = DocumentService.totalUsed(currentOrg.id)
  void STORAGE_BYTES[plan]
  const userLimit     = PLAN_USER_LIMITS[plan]

  function update(field: string, val: string) {
    setOrgForm(p => ({ ...p, [field]: val }))
    setSaved(false)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
    setSaved(false)
  }

  function save() {
    // TODO Phase 3: OrganizationService.update(currentOrg.id, orgForm)
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
            { field: 'name',    label: "Nom de l'organisation", placeholder: 'Nimba Industries SA' },
            { field: 'email',   label: 'Email administrateur',  placeholder: 'it@organisation.com' },
            { field: 'phone',   label: 'Téléphone',             placeholder: '+224 620 00 00 00' },
            { field: 'website', label: 'Site web',              placeholder: 'https://www.organisation.com' },
            { field: 'city',    label: 'Ville',                 placeholder: 'Conakry' },
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
              <span>{activeCount} utilisateur{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}</span>
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
                <div className="text-indigo-light text-xs line-through">{formatPrice(planPrices.monthly, currency)}</div>
                <div className="text-white font-bold">{formatPrice(discounted, currency)}</div>
                <div className="text-indigo-light text-xs">par mois · −{planPrices.discountPercent}% lancement</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex justify-between">
                <span>Utilisateurs actifs</span>
                <span className="font-semibold text-ink">{activeCount}{userLimit ? ` / ${userLimit}` : ''}</span>
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

          {plan === 'starter' && (
            <div className="bg-surface rounded-xl border border-border p-6">
              <h2 className="text-sm font-bold text-ink mb-3">Passer au plan Business</h2>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Plus de {userLimit} collaborateurs ou besoin de {STORAGE.business} ?
                Le plan Business offre plus de capacité avec les mêmes fonctionnalités.
                Essai de {TRIAL_DAYS} jours inclus.
              </p>
              <div className="flex items-center justify-between p-4 bg-bg rounded-xl mb-4">
                <div>
                  <div className="font-bold text-navy">Business</div>
                  <div className="text-xs text-muted">Utilisateurs illimités · {STORAGE.business}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-faint line-through">{formatPrice(otherPrices.monthly, currency)}/mois</div>
                  <div className="font-bold text-navy">{formatPrice(otherDiscounted, currency)}/mois</div>
                  <div className="text-xs text-indigo">−{otherPrices.discountPercent}% première année</div>
                </div>
              </div>
              <button className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                Passer au plan Business
              </button>
            </div>
          )}
        </div>
      )}

      {section === 'notifs' && (
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
              <button type="button" onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${notifs[key] ? 'bg-success' : 'bg-border'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${notifs[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
