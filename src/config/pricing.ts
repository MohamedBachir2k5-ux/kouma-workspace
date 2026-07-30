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
  free:       PlanPrices
  business:   PlanPrices
  enterprise: PlanPrices
}

// Free plan is always 0. Business has -40% first-year launch discount. Enterprise has -15%.
export const PRICING: Record<SupportedCurrency, CurrencyPricing> = {
  GNF: {
    free:       { monthly: 0,           discountPercent: 0  },
    business:   { monthly: 700_000,     discountPercent: 40 },
    enterprise: { monthly: 1_500_000,   discountPercent: 15 },
  },
  XOF: {
    free:       { monthly: 0,        discountPercent: 0  },
    business:   { monthly: 47_000,   discountPercent: 40 },
    enterprise: { monthly: 95_000,   discountPercent: 15 },
  },
  XAF: {
    free:       { monthly: 0,        discountPercent: 0  },
    business:   { monthly: 47_000,   discountPercent: 40 },
    enterprise: { monthly: 95_000,   discountPercent: 15 },
  },
  EUR: {
    free:       { monthly: 0,   discountPercent: 0  },
    business:   { monthly: 70,  discountPercent: 40 },
    enterprise: { monthly: 160, discountPercent: 15 },
  },
  USD: {
    free:       { monthly: 0,   discountPercent: 0  },
    business:   { monthly: 80,  discountPercent: 40 },
    enterprise: { monthly: 170, discountPercent: 15 },
  },
  CAD: {
    free:       { monthly: 0,    discountPercent: 0  },
    business:   { monthly: 110,  discountPercent: 40 },
    enterprise: { monthly: 230,  discountPercent: 15 },
  },
  GBP: {
    free:       { monthly: 0,   discountPercent: 0  },
    business:   { monthly: 60,  discountPercent: 40 },
    enterprise: { monthly: 140, discountPercent: 15 },
  },
  CHF: {
    free:       { monthly: 0,   discountPercent: 0  },
    business:   { monthly: 70,  discountPercent: 40 },
    enterprise: { monthly: 160, discountPercent: 15 },
  },
  RUB: {
    free:       { monthly: 0,         discountPercent: 0  },
    business:   { monthly: 7_000,     discountPercent: 40 },
    enterprise: { monthly: 16_000,    discountPercent: 15 },
  },
  MAD: {
    free:       { monthly: 0,      discountPercent: 0  },
    business:   { monthly: 800,    discountPercent: 40 },
    enterprise: { monthly: 1_800,  discountPercent: 15 },
  },
  NGN: {
    free:       { monthly: 0,           discountPercent: 0  },
    business:   { monthly: 125_000,     discountPercent: 40 },
    enterprise: { monthly: 250_000,     discountPercent: 15 },
  },
  GHS: {
    free:       { monthly: 0,      discountPercent: 0  },
    business:   { monthly: 1_300,  discountPercent: 40 },
    enterprise: { monthly: 2_800,  discountPercent: 15 },
  },
}

export const STORAGE: Record<'free' | 'business' | 'enterprise', string> = {
  free:        '5 Go',
  business:   '50 Go',
  enterprise: '250 Go',
}

export const STORAGE_BYTES: Record<'free' | 'business' | 'enterprise', number> = {
  free:         5 * 1024 * 1024 * 1024,
  business:    50 * 1024 * 1024 * 1024,
  enterprise: 250 * 1024 * 1024 * 1024,
}

export const PLAN_USER_LIMITS: Record<'free' | 'business' | 'enterprise', number | null> = {
  free:       25,
  business:   100,
  enterprise: null, // unlimited
}

export const TRIAL_DAYS = 21

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
