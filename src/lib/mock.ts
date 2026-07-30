// Initial state placeholders — replaced by real data immediately after session hydration.
// Only these 4 exports are used (in AuthContext.tsx as useState initial values).

import type { User, Organization, Subscription } from './types'
import { PRICING, STORAGE_BYTES } from '../config/pricing'

export const mockUser: User = {
  id: 'u1',
  organizationId: 'org1',
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  status: 'active',
  createdAt: '',
}

export const MOCK_ORG: Organization = {
  id: 'org1',
  name: '',
  logoUrl: null,
  email: '',
  phone: null,
  website: null,
  country: '',
  city: null,
  currency: 'GNF',
  language: 'fr',
  sector: null,
  size: null,
  plan: 'free',
  primaryColor: null,
  createdAt: '',
}

export const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub1',
  organizationId: 'org1',
  plan: 'free',
  status: 'active',
  currency: 'GNF',
  amount: PRICING.GNF.free.monthly,
  trialEndsAt: null,
  startDate: null,
  renewsAt: null,
  endDate: null,
  discountPercent: 0,
  discountEndsAt: null,
}

export const mockStorageQuotaBytes = STORAGE_BYTES[MOCK_SUBSCRIPTION.plan]
