// PaymentService — provider-agnostic abstraction layer.
// Current provider: LengoPay. Swap by replacing the implementation only.

import { supabase } from '../lib/supabase'
import type { PaymentRow } from '../lib/database.types'
import type { SupportedCurrency } from '../config/pricing'
import { PRICING, discountedPrice } from '../config/pricing'

export interface CreatePaymentParams {
  organizationId: string
  plan: 'free' | 'business' | 'enterprise'
  currency: SupportedCurrency
  applyDiscount: boolean
}

export interface PaymentResult {
  paymentId: string | null
  redirectUrl: string | null
  error: string | null
}

export interface PaymentCallback {
  providerReference: string
  status: 'success' | 'failed'
  amount: number
  currency: string
}

// ── Provider interface (swap without touching the rest of the app) ───────────

interface IPaymentProvider {
  initiate(params: { amount: number; currency: string; reference: string; callbackUrl: string }): Promise<{ redirectUrl: string; providerReference: string } | null>
  verify(providerReference: string): Promise<'success' | 'failed' | 'pending'>
}

// ── LengoPay implementation ──────────────────────────────────────────────────

class LengoPayProvider implements IPaymentProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async initiate(_params: { amount: number; currency: string; reference: string; callbackUrl: string }) {
    // TODO: Integrate LengoPay SDK when available.
    // Return { redirectUrl, providerReference } on success, null on error.
    console.warn('[LengoPay] SDK not yet integrated.')
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(_providerReference: string): Promise<'success' | 'failed' | 'pending'> {
    console.warn('[LengoPay] SDK not yet integrated.')
    return 'pending'
  }
}

const provider: IPaymentProvider = new LengoPayProvider()

// ── Public service ───────────────────────────────────────────────────────────

export const PaymentService = {
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const prices = PRICING[params.currency]
    const base = prices[params.plan].monthly
    const amount = params.applyDiscount
      ? discountedPrice(base, prices[params.plan].discountPercent)
      : base

    // Create pending record first
    const { data: record, error: dbError } = await supabase
      .from('payments')
      .insert({
        organization_id: params.organizationId,
        provider: 'lengopay',
        amount,
        currency: params.currency,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) return { paymentId: null, redirectUrl: null, error: dbError.message }

    const callbackUrl = `${import.meta.env.VITE_APP_URL}/payment/callback?payment=${record.id}`

    const providerResult = await provider.initiate({
      amount,
      currency: params.currency,
      reference: record.id,
      callbackUrl,
    })

    if (!providerResult) {
      return {
        paymentId: record.id,
        redirectUrl: null,
        error: 'Le service de paiement est temporairement indisponible.',
      }
    }

    await supabase
      .from('payments')
      .update({ provider_reference: providerResult.providerReference })
      .eq('id', record.id)

    return { paymentId: record.id, redirectUrl: providerResult.redirectUrl, error: null }
  },

  async handleCallback(paymentId: string, callback: PaymentCallback): Promise<{ error: string | null }> {
    const verified = await provider.verify(callback.providerReference)

    const status = verified === 'success' ? 'success' : 'failed'

    await supabase
      .from('payments')
      .update({ status, provider_reference: callback.providerReference })
      .eq('id', paymentId)

    if (status === 'success') {
      const { data: payment } = await supabase.from('payments').select('organization_id').eq('id', paymentId).single()
      if (payment) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        await supabase
          .from('subscriptions')
          .update({ status: 'active', start_date: new Date().toISOString(), end_date: nextMonth.toISOString() })
          .eq('organization_id', payment.organization_id)
      }
    }

    return { error: null }
  },

  async getHistory(organizationId: string): Promise<PaymentRow[]> {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    return data ?? []
  },

  async upgradeSubscription(organizationId: string, plan: 'business' | 'enterprise', currency: SupportedCurrency, applyDiscount: boolean): Promise<PaymentResult> {
    return this.createPayment({ organizationId, plan, currency, applyDiscount })
  },
}
