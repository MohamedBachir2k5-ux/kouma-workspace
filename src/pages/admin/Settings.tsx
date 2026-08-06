import { useState, useRef, useEffect } from 'react'
import { Building2, CreditCard, Bell, Camera, Loader2, Palette, BookOpen, Mail, ExternalLink, X, Trash2 } from 'lucide-react'

const SUPPORT_GUIDE_URL = '/resources/guides'
const SUPPORT_EMAIL     = 'support@kouma.app'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { DocumentService } from '../../services/document.service'
import { UserService } from '../../services/user.service'
import { OrganizationService } from '../../services/organization.service'
import { PaymentService } from '../../services/payment.service'
import { PRICING, STORAGE, PLAN_USER_LIMITS, TRIAL_DAYS, discountedPrice, formatPrice, CURRENCY_LABELS } from '../../config/pricing'
import { formatFileSize, formatShortDate } from '../../lib/utils'
import type { SupportedCurrency } from '../../config/pricing'

function orgInitials(name: string) {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'
}

export function AdminSettings() {
  const { t, i18n } = useTranslation()
  const { currentOrg, currentSubscription, updateCurrentOrg, signOut } = useAuth()

  const [orgForm, setOrgForm] = useState({
    name:    currentOrg.name,
    type:    currentOrg.sector ?? '',
    country: currentOrg.country,
    city:    currentOrg.city ?? '',
    email:   currentOrg.email,
    phone:   currentOrg.phone ?? '',
    website: currentOrg.website ?? '',
    currency: (currentOrg.currency as SupportedCurrency) ?? 'EUR',
    language: currentOrg.language || 'fr',
    primaryColor: currentOrg.primaryColor ?? '',
  })
  const NOTIFS_KEY = `notif_prefs_${currentOrg.id}`
  const [logoPreview, setLogoPreview] = useState<string | null>(currentOrg.logoUrl)
  const [saved, setSaved] = useState(false)
  const [section, setSection] = useState<'org' | 'plan' | 'notifs' | 'brand'>('org')
  const [notifs, setNotifs] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIFS_KEY)
      return stored ? JSON.parse(stored) : { invites: true, storage: true, failures: false, upgrade: true }
    } catch {
      return { invites: true, storage: true, failures: false, upgrade: true }
    }
  })
  const [notifSaved, setNotifSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  // Org deletion
  const [showDeleteOrgModal, setShowDeleteOrgModal] = useState(false)
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState('')
  const [deletingOrg, setDeletingOrg] = useState(false)
  const [deleteOrgError, setDeleteOrgError] = useState<string | null>(null)

  async function handleDeleteOrg() {
    if (deleteOrgConfirm !== currentOrg.name) return
    setDeletingOrg(true)
    setDeleteOrgError(null)
    const { error } = await OrganizationService.deleteOrganization(currentOrg.id)
    if (error) { setDeleteOrgError(error); setDeletingOrg(false); return }
    await signOut()
  }

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
    // Billing counts all non-deleted members (active + suspended) — Syli taa bills per
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
    setLogoError(null)
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
    const { logoUrl, error } = await OrganizationService.uploadLogo(currentOrg.id, file)
    if (!error && logoUrl) {
      setLogoPreview(logoUrl)
      updateCurrentOrg({ logoUrl })
    } else {
      setLogoPreview(currentOrg.logoUrl)
      setLogoError(error ?? t('settings.logoUploadError'))
    }
  }

  async function handleUpgrade() {
    setUpgrading(true)
    setUpgradeError(null)
    const target = nextPlan ?? 'business'
    const { redirectUrl, error } = await PaymentService.upgradeSubscription(currentOrg.id, target, currency, true)
    setUpgrading(false)
    if (error) { setUpgradeError(error); return }
    if (redirectUrl) { window.location.href = redirectUrl; return }
    setUpgradeError(t('settings.paymentUnavailable'))
  }

  async function save() {
    setSaveError(null)
    const primaryColor = orgForm.primaryColor.startsWith('#') ? orgForm.primaryColor : null
    const { error } = await OrganizationService.update(currentOrg.id, {
      name: orgForm.name,
      email: orgForm.email,
      phone: orgForm.phone || null,
      website: orgForm.website || null,
      city: orgForm.city || null,
      sector: orgForm.type || null,
      currency: orgForm.currency,
      language: orgForm.language,
      primary_color: primaryColor,
    })
    if (error) { setSaveError(error); return }
    updateCurrentOrg({
      name: orgForm.name,
      email: orgForm.email,
      phone: orgForm.phone || undefined,
      website: orgForm.website || undefined,
      city: orgForm.city || undefined,
      sector: orgForm.type || undefined,
      currency: orgForm.currency,
      language: orgForm.language,
      primaryColor,
    })
    i18n.changeLanguage(orgForm.language)
    if (primaryColor) {
      document.documentElement.style.setProperty('--color-navy', primaryColor)
    } else {
      document.documentElement.style.removeProperty('--color-navy')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">{t('settings.title')}</h1>
        <p className="text-sm text-muted mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-bg rounded-xl border border-border mb-6 w-fit">
        {[
          { id: 'org',    label: t('settings.organisation'),   icon: Building2 },
          { id: 'plan',   label: t('settings.subscription'),   icon: CreditCard },
          { id: 'notifs', label: t('settings.notifications'),  icon: Bell },
          { id: 'brand',  label: t('settings.customisation'),  icon: Palette },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSection(id as typeof section)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              section === id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {section === 'org' && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-sm font-bold text-ink">{t('settings.orgInfo')}</h2>

          {/* Logo */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('settings.logo')}</label>
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
                  className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-xl text-sm font-medium text-muted hover:bg-bg transition-colors">
                  <Camera size={14} /> {t('settings.changeLogo')}
                </button>
                <p className="text-xs text-faint mt-1">{t('settings.logoHint')}</p>
                {logoError && <p className="text-xs text-danger mt-1">{logoError}</p>}
              </div>
            </div>
          </div>

          {[
            { field: 'name',    label: t('settings.orgName'),    placeholder: t('settings.orgNamePlaceholder') },
            { field: 'email',   label: t('settings.adminEmail'), placeholder: 'admin@organisation.com' },
            { field: 'phone',   label: t('settings.phone'),      placeholder: '+XX XXXX XXXX' },
            { field: 'website', label: t('settings.website'),    placeholder: 'https://www.organisation.com' },
            { field: 'city',    label: t('settings.city'),       placeholder: t('settings.cityPlaceholder') },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{label}</label>
              <input value={orgForm[field as keyof typeof orgForm]} onChange={e => update(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('settings.sector')}</label>
            <select value={orgForm.type} onChange={e => update('type', e.target.value)}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy appearance-none">
              <option value="">{t('settings.sectorPlaceholder')}</option>
              {([
                { value: 'Secteur privé',                    label: t('settings.sectorPrivate') },
                { value: 'Secteur public',                    label: t('settings.sectorPublic') },
                { value: 'Organisation à but non lucratif',   label: t('settings.sectorNpo') },
                { value: 'Autre',                             label: t('settings.sectorOther') },
              ]).map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('settings.language')}</label>
            <select value={orgForm.language} onChange={e => update('language', e.target.value)}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy appearance-none">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="pt">Português</option>
            </select>
            <p className="text-xs text-faint mt-1">{t('settings.languageHint')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('settings.size')}</label>
            <div className="flex items-center justify-between w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink">
              <span>{memberCount} {memberCount > 1 ? t('common.collaborators') : t('common.collaborator')}</span>
              <span className="text-xs text-faint">{t('settings.sizeAuto')}</span>
            </div>
            <p className="text-xs text-faint mt-1">{t('settings.sizeHint')}</p>
          </div>

          {saveError && <p className="text-xs text-danger">{saveError}</p>}
          <button onClick={save}
            className={`mt-2 px-5 py-3 text-sm font-semibold rounded-xl transition-colors ${
              saved ? 'bg-success text-white' : 'bg-navy text-white hover:bg-navy-light'
            }`}>
            {saved ? t('common.saved') : t('common.save')}
          </button>
        </div>
      )}

      {section === 'plan' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ink">{t('settings.currentPlan')}</h2>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-full capitalize">
                {currentSubscription.status === 'active' ? t('settings.active') : currentSubscription.status}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-navy rounded-xl mb-4">
              <div>
                <div className="text-white font-bold text-lg capitalize">{plan}</div>
                <div className="text-indigo-light text-sm">
                  {userLimit ? `${t('pricing.upTo')} ${userLimit} ${t('settings.activeUsers')}` : t('settings.unlimitedUsers')} · {STORAGE[plan]}
                </div>
              </div>
              <div className="text-right">
                {planPrices.monthly === 0 ? (
                  <div className="text-white font-bold">{t('settings.priceFree')}</div>
                ) : (
                  <>
                    <div className="text-indigo-light text-xs line-through">{formatPrice(planPrices.monthly, currency)}</div>
                    <div className="text-white font-bold">{formatPrice(discounted, currency)}</div>
                    <div className="text-indigo-light text-xs">{t('settings.perMonthDiscount', { percent: String(planPrices.discountPercent) })}</div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex justify-between">
                <span>{t('common.collaborators')}</span>
                <span className="font-semibold text-ink">{memberCount}{userLimit ? ` / ${userLimit}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('settings.storageUsed')}</span>
                <span className="font-semibold text-ink">{formatFileSize(storageUsed)} / {STORAGE[plan]}</span>
              </div>
              {currentSubscription.discountEndsAt && (
                <div className="flex justify-between">
                  <span>{t('settings.launchDiscount')}</span>
                  <span className="font-semibold text-success">
                    −{currentSubscription.discountPercent}% · {t('pricing.until')} {formatShortDate(currentSubscription.discountEndsAt)}
                  </span>
                </div>
              )}
              {currentSubscription.renewsAt && (
                <div className="flex justify-between">
                  <span>{t('settings.nextBilling')}</span>
                  <span className="font-semibold text-ink">{formatShortDate(currentSubscription.renewsAt)}</span>
                </div>
              )}
            </div>
          </div>

          {nextPlan && otherPrices && (
            <div className="bg-surface rounded-xl border border-border p-6">
              <h2 className="text-sm font-bold text-ink mb-3">
                {t(nextPlan === 'business' ? 'settings.upgradeBusiness' : 'settings.upgradeEnterprise')}
              </h2>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                {nextPlan === 'business'
                  ? t('settings.upgradeDesc', { storage: STORAGE.business, trial: String(TRIAL_DAYS) })
                  : t('settings.upgradeDescEnterprise', { count: String(PLAN_USER_LIMITS.business), storage: STORAGE.enterprise })
                }
              </p>
              <div className="flex items-center justify-between p-4 bg-bg rounded-xl mb-4">
                <div>
                  <div className="font-bold text-navy capitalize">{nextPlan}</div>
                  <div className="text-xs text-muted">
                    {PLAN_USER_LIMITS[nextPlan] ? t('settings.upToUsers', { count: String(PLAN_USER_LIMITS[nextPlan]) }) : t('settings.unlimitedUsers')} · {STORAGE[nextPlan]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-faint line-through">{formatPrice(otherPrices.monthly, currency)}{t('pricing.monthly')}</div>
                  <div className="font-bold text-navy">{formatPrice(otherDiscounted, currency)}{t('pricing.monthly')}</div>
                  <div className="text-xs text-indigo">{t('settings.firstYearDiscount', { percent: String(otherPrices.discountPercent) })}</div>
                </div>
              </div>
              {upgradeError && (
                <p className="text-xs text-danger mb-3">{upgradeError}</p>
              )}
              <button onClick={handleUpgrade} disabled={upgrading}
                className="w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                {upgrading && <Loader2 size={15} className="animate-spin" />}
                {upgrading ? t('settings.redirecting') : t(nextPlan === 'business' ? 'settings.upgradeBusiness' : 'settings.upgradeEnterprise')}
              </button>
            </div>
          )}
        </div>
      )}

      {section === 'notifs' && (
        <div>
        {notifSaved && <p className="text-xs text-success mb-3 px-1">{t('settings.notifsSaved')}</p>}
        <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
          {([
            { key: 'invites',  label: t('settings.newMembersNotif'), desc: t('settings.newMembersDesc') },
            { key: 'storage',  label: t('settings.storageAlerts'),   desc: t('settings.storageAlertsDesc') },
            { key: 'failures', label: t('settings.failedLogins'),    desc: t('settings.failedLoginsDesc') },
            { key: 'upgrade',  label: t('settings.autoUpgrade'),     desc: t('settings.autoUpgradeDesc', { count: String(userLimit ?? 100) }) },
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

      {section === 'brand' && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
          <h2 className="text-sm font-bold text-ink">{t('settings.customisation')}</h2>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('settings.currency')}</label>
            <select
              value={orgForm.currency}
              onChange={e => { update('currency', e.target.value); setSaved(false) }}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy appearance-none">
              {(Object.entries(CURRENCY_LABELS) as [SupportedCurrency, string][]).map(([code, label]) => (
                <option key={code} value={code}>{label} ({code})</option>
              ))}
            </select>
            <p className="text-xs text-faint mt-1">{t('settings.currencyHint')}</p>
          </div>

          {/* Primary color */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('settings.primaryColor')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={orgForm.primaryColor || '#0f1628'}
                onChange={e => { update('primaryColor', e.target.value); setSaved(false) }}
                className="w-12 h-12 rounded-xl border border-border cursor-pointer bg-bg p-1"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={orgForm.primaryColor}
                  onChange={e => { update('primaryColor', e.target.value); setSaved(false) }}
                  placeholder="#0f1628"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              {orgForm.primaryColor && (
                <button type="button" onClick={() => { update('primaryColor', ''); setSaved(false) }}
                  className="px-3 py-3 border border-border rounded-xl text-xs text-muted hover:bg-bg">
                  {t('settings.resetColor')}
                </button>
              )}
            </div>
            <p className="text-xs text-faint mt-1">{t('settings.primaryColorHint')}</p>
          </div>

          {/* Preview */}
          {orgForm.primaryColor && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-bg">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: orgForm.primaryColor }}>
                {orgInitials(orgForm.name)}
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{orgForm.name}</div>
                <div className="text-xs text-muted">{t('settings.colorPreview')}</div>
              </div>
              <div className="ml-auto">
                <div className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
                  style={{ backgroundColor: orgForm.primaryColor }}>
                  {t('settings.colorPreviewButton')}
                </div>
              </div>
            </div>
          )}

          {saveError && <p className="text-xs text-danger">{saveError}</p>}
          <button onClick={save}
            className={`mt-2 px-5 py-3 text-sm font-semibold rounded-xl transition-colors ${
              saved ? 'bg-success text-white' : 'bg-navy text-white hover:bg-navy-light'
            }`}>
            {saved ? t('common.saved') : t('common.save')}
          </button>
        </div>
      )}
      {/* Suppression de l'organisation */}
      <div className="mt-6 bg-surface rounded-xl border border-danger/25 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-danger/8 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 size={15} className="text-danger" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink mb-1">{t('settings.deleteOrgTitle')}</p>
            <p className="text-xs text-muted leading-relaxed mb-3">{t('settings.deleteOrgDesc')}</p>
            <button
              onClick={() => { setShowDeleteOrgModal(true); setDeleteOrgConfirm(''); setDeleteOrgError(null) }}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger/8 transition-colors"
            >
              {t('settings.deleteOrgBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Guide & Support */}
      <div className="mt-6 bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold text-ink mb-4">{t('settings.guideTitle')}</h2>
        <div className="space-y-3">
          <a href={SUPPORT_GUIDE_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-bg transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-indigo/10 flex items-center justify-center shrink-0">
              <BookOpen size={15} className="text-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">{t('settings.guideUserTitle')}</div>
              <div className="text-xs text-muted">{t('settings.guideUserDesc')}</div>
            </div>
            <ExternalLink size={13} className="text-faint group-hover:text-muted transition-colors shrink-0" />
          </a>

          <a href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-bg transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Mail size={15} className="text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">{t('settings.supportEmailLabel')}</div>
              <div className="text-xs text-muted">{SUPPORT_EMAIL}</div>
            </div>
            <ExternalLink size={13} className="text-faint group-hover:text-muted transition-colors shrink-0" />
          </a>

        </div>
      </div>
    </div>

    {/* Delete org modal */}
    {showDeleteOrgModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !deletingOrg && setShowDeleteOrgModal(false)}>
        <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-bold text-danger">{t('settings.deleteOrgTitle')}</h3>
            {!deletingOrg && <button onClick={() => setShowDeleteOrgModal(false)} aria-label={t('common.close')} className="w-10 h-10 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={16} /></button>}
          </div>
          <div className="p-5 space-y-4">
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl">
              <p className="text-xs text-danger leading-relaxed">{t('settings.deleteOrgWarning')}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">{t('settings.deleteOrgConfirmLabel', { name: currentOrg.name })}</label>
              <input
                type="text"
                value={deleteOrgConfirm}
                onChange={e => setDeleteOrgConfirm(e.target.value)}
                placeholder={currentOrg.name}
                disabled={deletingOrg}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-danger disabled:opacity-50"
              />
            </div>
            {deleteOrgError && <p className="text-xs text-danger">{deleteOrgError}</p>}
            <button
              onClick={handleDeleteOrg}
              disabled={deleteOrgConfirm !== currentOrg.name || deletingOrg}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deletingOrg ? <><Loader2 size={14} className="animate-spin" /> {t('common.loading')}</> : t('settings.deleteOrgConfirmBtn')}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
    </>
  )
}
