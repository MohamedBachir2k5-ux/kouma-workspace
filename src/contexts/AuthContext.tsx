import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Organization, Subscription } from '../lib/types'
import { mockUser, MOCK_ORG, MOCK_SUBSCRIPTION, mockStorageQuotaBytes } from '../lib/mock'
import { STORAGE_BYTES } from '../config/pricing'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/auth.service'
import { OrganizationService } from '../services/organization.service'
import { UserService } from '../services/user.service'
import { SessionService } from '../services/session.service'
import type { ProfileRow, OrganizationRow, SubscriptionRow } from '../lib/database.types'

// ── Mappers ───────────────────────────────────────────────────────────────────

function profileToUser(p: ProfileRow, orgId: string): User {
  return {
    id: p.id,
    organizationId: orgId,
    firstName: p.firstname,
    lastName: p.lastname,
    email: p.email,
    phone: p.phone ?? undefined,
    avatarUrl: p.avatar_url ?? undefined,
    country: p.country ?? undefined,
    language: p.language,
    role: '',
    status: p.status as User['status'],
    createdAt: p.created_at,
  }
}

function orgRowToOrganization(r: OrganizationRow): Organization {
  return {
    id: r.id,
    name: r.name,
    logoUrl: r.logo_url,
    email: r.email,
    phone: r.phone,
    website: r.website,
    country: r.country,
    city: r.city,
    currency: r.currency,
    language: r.language,
    sector: r.sector,
    size: r.size,
    plan: r.plan as Organization['plan'],
    createdAt: r.created_at,
  }
}

function subRowToSubscription(r: SubscriptionRow): Subscription {
  return {
    id: r.id,
    organizationId: r.organization_id,
    plan: r.plan as Subscription['plan'],
    status: r.status as Subscription['status'],
    currency: r.currency,
    amount: r.amount,
    trialEndsAt: r.trial_ends_at,
    startDate: r.start_date,
    renewsAt: r.renews_at,
    endDate: r.end_date,
    discountPercent: r.discount_percent,
    discountEndsAt: r.discount_ends_at,
  }
}

// ── Supabase availability check ───────────────────────────────────────────────

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return Boolean(url && url.startsWith('https://') && !url.includes('your-project'))
}

// ── Shape ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: User
  currentOrg: Organization
  currentSubscription: Subscription
  storageQuotaBytes: number
  loading: boolean
  currentSessionId: string | null
  signOut: () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User>(mockUser)
  const [currentOrg, setCurrentOrg] = useState<Organization>(MOCK_ORG)
  const [currentSubscription, setCurrentSubscription] = useState<Subscription>(MOCK_SUBSCRIPTION)
  const [storageQuotaBytes, setStorageQuotaBytes] = useState(mockStorageQuotaBytes)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    async function hydrateFromSession(userId: string, isNewLogin = false) {
      try {
        const [profile, orgRow] = await Promise.all([
          UserService.getById(userId),
          OrganizationService.getForUser(userId),
        ])

        if (!profile || !orgRow) return

        const subRow = await OrganizationService.getSubscription(orgRow.id)

        setCurrentUser(profileToUser(profile, orgRow.id))
        setCurrentOrg(orgRowToOrganization(orgRow))
        if (subRow) {
          setCurrentSubscription(subRowToSubscription(subRow))
          setStorageQuotaBytes(STORAGE_BYTES[subRow.plan as keyof typeof STORAGE_BYTES] ?? STORAGE_BYTES.starter)
        }

        // Register session on new login
        if (isNewLogin) {
          const sessionId = await SessionService.register(userId)
          setCurrentSessionId(sessionId)

          // Heartbeat every 5 minutes
          if (heartbeatRef.current) clearInterval(heartbeatRef.current)
          if (sessionId) {
            heartbeatRef.current = setInterval(() => {
              SessionService.heartbeat(sessionId)
            }, 5 * 60 * 1000)
          }
        }
      } catch {
        // Network error or RLS denied — keep mock fallback
      } finally {
        setLoading(false)
      }
    }

    // Check existing session immediately (not a new login — no new session record)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        hydrateFromSession(data.session.user.id, false)
      } else {
        setLoading(false)
      }
    })

    // Re-hydrate on login / token refresh / sign-out
    const { data: { subscription } } = AuthService.onAuthChange((userId) => {
      if (userId) {
        setLoading(true)
        hydrateFromSession(userId, true)
      } else {
        setCurrentUser(mockUser)
        setCurrentOrg(MOCK_ORG)
        setCurrentSubscription(MOCK_SUBSCRIPTION)
        setStorageQuotaBytes(mockStorageQuotaBytes)
        setCurrentSessionId(null)
        if (heartbeatRef.current) clearInterval(heartbeatRef.current)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [])

  async function signOut() {
    if (isSupabaseConfigured()) {
      if (currentSessionId) await SessionService.deleteSession(currentSessionId)
      await AuthService.signOut()
    }
    window.location.href = '/connexion'
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      currentOrg,
      currentSubscription,
      storageQuotaBytes,
      loading,
      currentSessionId,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>')
  return ctx
}
