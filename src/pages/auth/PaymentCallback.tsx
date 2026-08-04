import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'

type Status = 'loading' | 'success' | 'failed' | 'pending'

export function PaymentCallback() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const paymentId = params.get('payment')
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!paymentId) { setStatus('failed'); return }

    supabase
      .from('payments')
      .select('status')
      .eq('id', paymentId)
      .single()
      .then(({ data }) => {
        if (!data) { setStatus('failed'); return }
        if (data.status === 'success') setStatus('success')
        else if (data.status === 'failed') setStatus('failed')
        else setStatus('pending')
      })
  }, [paymentId])

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-4 safe-area-bottom">
      <div className="text-center max-w-sm w-full">

        {status === 'loading' && (
          <>
            <Loader2 size={36} className="text-indigo animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-ink mb-2">{t('auth.checkingPayment')}</h2>
            <p className="text-sm text-muted">{t('auth.checkingPaymentDesc')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">{t('auth.paymentSuccess')}</h2>
            <p className="text-sm text-muted mb-8">{t('auth.paymentSuccessDesc')}</p>
            <Link to="/admin/parametres"
              className="inline-block px-6 py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
              {t('auth.backToSettings')}
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-5">
              <XCircle size={32} className="text-danger" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">{t('auth.paymentFailed')}</h2>
            <p className="text-sm text-muted mb-8">{t('auth.paymentFailedDesc')}</p>
            <Link to="/admin/parametres"
              className="inline-block px-6 py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
              {t('auth.retry')}
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-5">
              <Clock size={32} className="text-amber" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">{t('auth.paymentPending')}</h2>
            <p className="text-sm text-muted mb-8">{t('auth.paymentPendingDesc')}</p>
            <Link to="/admin/parametres"
              className="inline-block px-6 py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
              {t('auth.backToSettings')}
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
