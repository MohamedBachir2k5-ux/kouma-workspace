// Kouma pricing configuration — multi-currency, commercially controlled.
// Never auto-convert from exchange rates: each price is set deliberately.

export type SupportedCurrency = 'GNF' | 'XOF' | 'XAF' | 'EUR' | 'USD' | 'CAD' | 'GBP' | 'CHF' | 'RUB' | 'MAD' | 'NGN' | 'GHS'

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  GNF: 'Franc guinéen (GNF)',
  XOF: 'Franc CFA UEMOA (XOF)',
  XAF: 'Franc CFA BEAC (XAF)',
  EUR: 'Euro (EUR)',
  USD: 'Dollar américain (USD)',
  CAD: 'Dollar canadien (CAD)',
  GBP: 'Livre sterling (GBP)',
  CHF: 'Franc suisse (CHF)',
  RUB: 'Rouble russe (RUB)',
  MAD: 'Dirham marocain (MAD)',
  NGN: 'Naira nigérian (NGN)',
  GHS: 'Cédi ghanéen (GHS)',
}

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  GNF: 'GNF', XOF: 'FCFA', XAF: 'FCFA', EUR: '€',
  USD: '$', CAD: 'CA$', GBP: '£', CHF: 'CHF',
  RUB: '₽', MAD: 'MAD', NGN: '₦', GHS: 'GH₵',
}

interface PlanPrices {
  monthly: number
  discountPercent: number
}

interface CurrencyPricing {
  starter: PlanPrices
  business: PlanPrices
}

// Base prices per currency.
// Discounts: Starter -40% first year, Business -15% first year.
export const PRICING: Record<SupportedCurrency, CurrencyPricing> = {
  GNF: {
    starter:  { monthly: 700_000,   discountPercent: 40 },
    business: { monthly: 1_500_000, discountPercent: 15 },
  },
  XOF: {
    starter:  { monthly: 45_000,  discountPercent: 40 },
    business: { monthly: 95_000,  discountPercent: 15 },
  },
  XAF: {
    starter:  { monthly: 45_000,  discountPercent: 40 },
    business: { monthly: 95_000,  discountPercent: 15 },
  },
  EUR: {
    starter:  { monthly: 75,  discountPercent: 40 },
    business: { monthly: 160, discountPercent: 15 },
  },
  USD: {
    starter:  { monthly: 80,  discountPercent: 40 },
    business: { monthly: 170, discountPercent: 15 },
  },
  CAD: {
    starter:  { monthly: 110, discountPercent: 40 },
    business: { monthly: 230, discountPercent: 15 },
  },
  GBP: {
    starter:  { monthly: 65,  discountPercent: 40 },
    business: { monthly: 140, discountPercent: 15 },
  },
  CHF: {
    starter:  { monthly: 75,  discountPercent: 40 },
    business: { monthly: 160, discountPercent: 15 },
  },
  RUB: {
    starter:  { monthly: 7_500,  discountPercent: 40 },
    business: { monthly: 16_000, discountPercent: 15 },
  },
  MAD: {
    starter:  { monthly: 850,   discountPercent: 40 },
    business: { monthly: 1_800, discountPercent: 15 },
  },
  NGN: {
    starter:  { monthly: 120_000, discountPercent: 40 },
    business: { monthly: 250_000, discountPercent: 15 },
  },
  GHS: {
    starter:  { monthly: 1_300, discountPercent: 40 },
    business: { monthly: 2_800, discountPercent: 15 },
  },
}

export const STORAGE: Record<'starter' | 'business', string> = {
  starter:  '50 Go',
  business: '250 Go',
}

export const STORAGE_BYTES: Record<'starter' | 'business', number> = {
  starter:   50 * 1024 * 1024 * 1024,
  business: 250 * 1024 * 1024 * 1024,
}

export const PLAN_USER_LIMITS: Record<'starter' | 'business', number | null> = {
  starter:  100,
  business: null, // unlimited
}

export const TRIAL_DAYS = 15

export function discountedPrice(monthly: number, discountPercent: number): number {
  return Math.round(monthly * (1 - discountPercent / 100))
}

export function formatPrice(amount: number, currency: SupportedCurrency): string {
  if (['GNF', 'XOF', 'XAF', 'NGN'].includes(currency)) {
    return amount.toLocaleString('fr-FR') + ' ' + CURRENCY_SYMBOLS[currency]
  }
  if (['EUR', 'USD', 'CAD', 'GBP', 'CHF'].includes(currency)) {
    return CURRENCY_SYMBOLS[currency] + amount.toFixed(0)
  }
  return amount.toLocaleString('fr-FR') + ' ' + CURRENCY_SYMBOLS[currency]
}
