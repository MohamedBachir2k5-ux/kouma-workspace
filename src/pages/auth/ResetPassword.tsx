import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { AuthService } from '../../services/auth.service'
import { KeyService } from '../../services/key.service'

export function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({ next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
        setUserId(session?.user?.id ?? null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const valid = form.next.length >= 8 && form.next === form.confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError(null)

    const { error: authErr } = await AuthService.updatePassword(form.next)
    if (authErr) { setError(authErr); setLoading(false); return }

    if (userId) {
      await KeyService.rewrapPrivateKey(userId, form.next)
    }

    setLoading(false)
    setDone(true)
    setTimeout(() => navigate('/connexion'), 3000)
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 safe-area-bottom">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">{t('resetPassword.verifying')}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 safe-area-bottom">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-success" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">{t('resetPassword.successTitle')}</h2>
          <p className="text-sm text-muted">{t('resetPassword.successText')}</p>
        </div>
      </div>
    )
  }

  const fields = [
    { field: 'next' as const,    label: t('resetPassword.newPassword'), placeholder: t('resetPassword.newPasswordPlaceholder') },
    { field: 'confirm' as const, label: t('resetPassword.confirm'),     placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink mb-1">{t('resetPassword.title')}</h1>
          <p className="text-sm text-muted">{t('resetPassword.subtitle')}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">{t('resetPassword.warning')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className={`w-full px-4 py-3 pr-10 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
                    field === 'confirm' && form.confirm && form.next !== form.confirm
                      ? 'border-danger' : 'border-border'
                  }`}
                />
                {field === 'next' && (
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-faint hover:text-muted rounded-lg">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              {field === 'confirm' && form.confirm && form.next !== form.confirm && (
                <p className="mt-1 text-xs text-danger">{t('resetPassword.mismatch')}</p>
              )}
            </div>
          ))}

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={!valid || loading}
            className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? t('resetPassword.updating') : t('resetPassword.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
