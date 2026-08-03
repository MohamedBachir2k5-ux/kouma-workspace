import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChevronDown, Check, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthService, ERR_EMAIL_ALREADY_USED } from '../../services/auth.service'
import { UserService, ERR_ALREADY_MEMBER } from '../../services/user.service'
import { DepartmentService } from '../../services/department.service'
import { KeyService } from '../../services/key.service'
import { useAuth } from '../../contexts/AuthContext'
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
  const { t } = useTranslation()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { refreshCurrentOrg } = useAuth()

  const [invite, setInvite] = useState<{ organizationId: string } | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeSession, setActiveSession] = useState(false)

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
    AuthService.getSession().then(session => {
      if (session?.user) setActiveSession(true)
    })

    if (!token) { setLoadError(t('joinOrg.invalidLink')); return }
    UserService.getInviteByToken(token).then(async data => {
      if (!data) { setLoadError(t('joinOrg.expiredLink')); return }
      setInvite(data)
      const depts = await DepartmentService.listByInviteToken(token)
      setDepartments(depts)
    })
  }, [token, t])

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function isWeakPin(p: string): boolean {
    if (/^(\d)\1{5}$/.test(p)) return true
    const d = p.split('').map(Number)
    let asc = true, desc = true
    for (let i = 1; i < d.length; i++) {
      if (d[i] !== d[i-1] + 1) asc = false
      if (d[i] !== d[i-1] - 1) desc = false
    }
    return asc || desc
  }

  const deptRequired = departments.length > 0
  const pinValid = /^\d{6}$/.test(form.pin) && form.pin === form.confirmPin && !isWeakPin(form.pin)
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

    let userId: string | null = null
    let isExistingAccount = false

    const { userId: newUserId, error: signUpError } = await AuthService.signUp({
      email: form.email.trim(),
      password: form.pin,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
    })

    if (signUpError === ERR_EMAIL_ALREADY_USED) {
      const { userId: existingId, error: signInError } = await AuthService.signIn({
        email: form.email.trim(),
        password: form.pin,
      })
      if (signInError || !existingId) {
        setError(t('joinOrg.accountExists'))
        setLoading(false)
        return
      }
      userId = existingId
      isExistingAccount = true
    } else if (signUpError || !newUserId) {
      setError(signUpError ?? t('joinOrg.errorAccount'))
      setLoading(false)
      return
    } else {
      userId = newUserId
    }

    if (!isExistingAccount) {
      const { error: keyError } = await KeyService.generateAndStoreUserKeys(userId, form.pin)
      if (keyError) {
        setError(t('joinOrg.errorKeys'))
        setLoading(false)
        return
      }
    }

    const { error: joinError } = await UserService.acceptInvite(token, userId, {
      departmentId: form.departmentId || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
    })

    if (joinError && joinError !== ERR_ALREADY_MEMBER) {
      setError(joinError)
      setLoading(false)
      return
    }

    const orgFound = await refreshCurrentOrg()
    if (!orgFound) {
      setError(t('joinOrg.errorOrg'))
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => navigate('/app/messages', { replace: true }), 2000)
  }

  if (loadError) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-danger mb-4">{loadError}</p>
          <Link to="/" className="text-sm text-indigo hover:underline">{t('joinOrg.backToHome')}</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">{t('joinOrg.successTitle')}</h2>
          <p className="text-sm text-muted leading-relaxed">{t('joinOrg.successText')}</p>
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
        {activeSession && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">{t('joinOrg.sessionWarning')}</p>
          </div>
        )}
        <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-navy mb-1">{t('joinOrg.pageTitle')}</h1>
            <p className="text-sm text-muted leading-relaxed">{t('joinOrg.pageSubtitle')}</p>
          </div>

          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                {t('joinOrg.emailLabel')} *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder={t('joinOrg.emailPlaceholder')}
                autoFocus
                disabled={!ready}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
              />
            </div>

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('joinOrg.firstName')} *</label>
                <input
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  placeholder={t('joinOrg.firstNamePlaceholder')}
                  disabled={!ready}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('joinOrg.lastName')} *</label>
                <input
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  placeholder={t('joinOrg.lastNamePlaceholder')}
                  disabled={!ready}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                {t('joinOrg.phone')} <span className="font-normal text-faint normal-case">({t('common.optional')})</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+XX XXXX XXXX"
                disabled={!ready}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
              />
            </div>

            {/* Department */}
            {deptRequired && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                  {t('joinOrg.department')} *
                </label>
                <div className="relative">
                  <select
                    value={form.departmentId}
                    onChange={e => update('departmentId', e.target.value)}
                    disabled={!ready}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
                  >
                    <option value="">{t('joinOrg.selectDepartment')}</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                </div>
              </div>
            )}

            {/* Job title */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('joinOrg.jobTitle')} *</label>
              <input
                value={form.jobTitle}
                onChange={e => update('jobTitle', e.target.value)}
                placeholder={t('joinOrg.jobTitlePlaceholder')}
                disabled={!ready}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                {t('joinOrg.pin')} * <span className="font-normal text-faint normal-case">{t('joinOrg.pin6digits')}</span>
              </label>
              <PinInput
                value={form.pin}
                onChange={v => update('pin', v)}
                disabled={!ready}
              />
              <p className="mt-1 text-[10px] text-faint">{t('joinOrg.pinHint')}</p>
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                {t('joinOrg.confirmPin')} *
              </label>
              <PinInput
                value={form.confirmPin}
                onChange={v => update('confirmPin', v)}
                placeholder={form.pin.length === 6 && form.confirmPin && form.pin !== form.confirmPin ? '......' : '••••••'}
                disabled={!ready}
              />
              {form.confirmPin && form.pin !== form.confirmPin && (
                <p className="mt-1 text-xs text-danger">{t('joinOrg.pinMismatch')}</p>
              )}
              {form.pin.length === 6 && form.pin === form.confirmPin && isWeakPin(form.pin) && (
                <p className="mt-1 text-xs text-danger">{t('joinOrg.weakPin')}</p>
              )}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-danger text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!valid || loading || !ready}
            className="mt-6 w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? t('joinOrg.creating') : <><span>{t('joinOrg.createAccount')}</span><ArrowRight size={15} /></>}
          </button>

          <p className="mt-4 text-center text-xs text-faint leading-relaxed">
            {t('joinOrg.termsPrefix')}{' '}
            <Link to="/legal/cgu" className="text-indigo hover:underline">{t('joinOrg.termsLink')}</Link>{' '}
            {t('joinOrg.termsSuffix')}
          </p>
        </div>
      </div>
    </div>
  )
}
