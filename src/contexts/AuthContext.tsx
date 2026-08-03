import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import i18n from '../i18n/index'
import { tracerSetContext } from '../lib/tracer'
import type { User, Organization, Subscription } from '../lib/types'
import { mockUser, MOCK_ORG, MOCK_SUBSCRIPTION, mockStorageQuotaBytes } from '../lib/mock'
import { STORAGE_BYTES } from '../config/pricing'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/auth.service'
import { OrganizationService } from '../services/organization.service'
import { UserService } from '../services/user.service'
import { SessionService } from '../services/session.service'
import { PushService } from '../services/push.service'
import type { ProfileRow, OrganizationRow, SubscriptionRow } from '../lib/database.types'

// ── Mappers ───────────────────────────────────────────────────────────────────

function profileToUser(p: ProfileRow, orgId: string): User {
  return {
    id: p.id,
    organizationId: orgId,
    firstName: p.firstname ?? '',
    lastName: p.lastname ?? '',
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
    primaryColor: r.primary_color ?? null,
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
  return Boolean(url && !url.includes('your-project') && (url.startsWith('https://') || url.startsWith('http://')))
}

// ── Shape ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: User
  currentOrg: Organization
  currentSubscription: Subscription
  storageQuotaBytes: number
  loading: boolean
  isOrgReady: boolean
  currentSessionId: string | null
  orgLoadError: string | null
  signOut: () => Promise<void>
  updateCurrentOrg: (updates: Partial<Organization>) => void
  refreshCurrentOrg: () => Promise<boolean>
}

// ── Context ───────────────────────────────────────────────────────────────────

// Stable context reference across HMR re-imports: store on globalThis so the same
// object identity is reused when Vite re-evaluates this module during hot reload.
// Without this, each HMR cycle creates a new context object, breaking useAuth()
// in already-mounted consumers (they see null from useContext of the new object).
declare global { interface Window { __KoumaAuthContext__?: React.Context<AuthContextValue | null> } }
if (!window.__KoumaAuthContext__) {
  window.__KoumaAuthContext__ = createContext<AuthContextValue | null>(null)
}
const AuthContext = window.__KoumaAuthContext__

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isOrgReady, setIsOrgReady] = useState(false)
  const [currentUser, setCurrentUser] = useState<User>(mockUser)
  const [currentOrg, setCurrentOrg] = useState<Organization>(MOCK_ORG)
  const [currentSubscription, setCurrentSubscription] = useState<Subscription>(MOCK_SUBSCRIPTION)
  const [storageQuotaBytes, setStorageQuotaBytes] = useState(mockStorageQuotaBytes)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [orgLoadError, setOrgLoadError] = useState<string | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Keeps isOrgReady readable synchronously so hydrateFromSession can't override
  // a true value that refreshCurrentOrg already committed (race-condition guard).
  const isOrgReadyRef = useRef(false)
  // Tracks whether a real session was ever established so we can redirect on unexpected SIGNED_OUT.
  const wasAuthenticatedRef = useRef(false)

  function setOrgReady(ready: boolean) {
    isOrgReadyRef.current = ready
    setIsOrgReady(ready)
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setOrgReady(true)
      setLoading(false)
      return
    }

    async function hydrateFromSession(userId: string, isNewLogin = false) {
      try {
        const [profile, orgRow] = await Promise.all([
          UserService.getById(userId),
          OrganizationService.getForUser(userId),
        ])

        if (!profile) {
          // Profile returned null. This can mean:
          // a) Account genuinely deleted (force signout)
          // b) JWT just expired mid-request (transient 401, not a deleted account)
          // Verify with a direct auth check before forcing signout.
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            await supabase.auth.signOut()
          }
          // If user still exists, the profile fetch failed transiently — do nothing;
          // TOKEN_REFRESHED will trigger another hydrateFromSession call.
          return
        }
        if (!orgRow) {
          if (!isOrgReadyRef.current) {
            setOrgLoadError('Aucune organisation trouvée pour ce compte. Veuillez compléter l\'inscription.')
            setOrgReady(false)
          }
          return
        }
        setOrgLoadError(null)

        const [subRow, memberInfo] = await Promise.all([
          OrganizationService.getSubscription(orgRow.id),
          UserService.getMemberInfo(userId, orgRow.id),
        ])

        const user = profileToUser(profile, orgRow.id)
        user.role = memberInfo?.role ?? 'member'
        user.jobTitle = memberInfo?.jobTitle
        user.department = memberInfo?.department
        setCurrentUser(user)
        const org = orgRowToOrganization(orgRow)
        setCurrentOrg(org)
        tracerSetContext(user.id, orgRow.id)

        // Apply user language from DB
        const lang = user.language || org.language || 'fr'
        if (lang !== i18n.language) {
          i18n.changeLanguage(lang)
          localStorage.setItem('kouma_lang', lang)
        }

        // Apply org primary color as CSS variable — validate hex to prevent CSS injection
        if (org.primaryColor && /^#[0-9a-fA-F]{3,8}$/.test(org.primaryColor)) {
          document.documentElement.style.setProperty('--color-navy', org.primaryColor)
        } else {
          document.documentElement.style.removeProperty('--color-navy')
        }
        wasAuthenticatedRef.current = true
        setOrgReady(true)
        if (subRow) {
          setCurrentSubscription(subRowToSubscription(subRow))
          setStorageQuotaBytes(STORAGE_BYTES[subRow.plan as keyof typeof STORAGE_BYTES] ?? STORAGE_BYTES.free)
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
      } catch (e) {
        console.error('[AuthContext] hydrateFromSession error:', e)
        setOrgLoadError('Erreur de chargement du compte. Veuillez recharger la page.')
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
    const { data: { subscription } } = AuthService.onAuthChange((userId, event) => {
      if (userId) {
        setLoading(true)
        hydrateFromSession(userId, event === 'SIGNED_IN')
      } else {
        const hadSession = wasAuthenticatedRef.current
        setCurrentUser(mockUser)
        setCurrentOrg(MOCK_ORG)
        setCurrentSubscription(MOCK_SUBSCRIPTION)
        setStorageQuotaBytes(mockStorageQuotaBytes)
        setCurrentSessionId(null)
        setOrgReady(false)
        wasAuthenticatedRef.current = false
        if (heartbeatRef.current) clearInterval(heartbeatRef.current)
        setLoading(false)
        // On SIGNED_OUT: wait briefly for BroadcastChannel to sync a token refresh
        // from another tab before deciding to redirect. This prevents false logouts
        // when two tabs race to refresh the same refresh token and one loses.
        if (hadSession && event === 'SIGNED_OUT') {
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
              window.location.href = '/connexion'
            }
            // If a session exists here, TOKEN_REFRESHED re-hydrates via onAuthChange
          }, 1200)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [])

  function updateCurrentOrg(updates: Partial<Organization>) {
    setCurrentOrg(prev => ({ ...prev, ...updates }))
  }

  async function refreshCurrentOrg(): Promise<boolean> {
    const session = await supabase.auth.getSession()
    const userId = session.data.session?.user?.id
    if (!userId) {
      console.error('[AuthContext] refreshCurrentOrg: no active session')
      setLoading(false)
      return false
    }
    const [profile, orgRow] = await Promise.all([
      UserService.getById(userId),
      OrganizationService.getForUser(userId),
    ])
    if (!orgRow) {
      console.error('[AuthContext] refreshCurrentOrg: org not found for user', userId, '— acceptInvite may have failed silently')
      setLoading(false)
      return false
    }
    const memberInfo = await UserService.getMemberInfo(userId, orgRow.id)
    setCurrentOrg(orgRowToOrganization(orgRow))
    setOrgReady(true)
    setOrgLoadError(null)
    if (profile) {
      const user = profileToUser(profile, orgRow.id)
      user.role = memberInfo?.role ?? 'member'
      user.jobTitle = memberInfo?.jobTitle
      user.department = memberInfo?.department
      setCurrentUser(user)
    }
    setLoading(false)
    return true
  }

  async function signOut() {
    tracerSetContext(undefined, undefined)
    if (isSupabaseConfigured()) {
      // Clean up push subscription before session is invalidated
      if (currentUser?.id) await PushService.unsubscribe(currentUser.id).catch(() => {})
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
      isOrgReady,
      currentSessionId,
      orgLoadError,
      signOut,
      updateCurrentOrg,
      refreshCurrentOrg,
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

// Force full-page reload on HMR instead of partial module replacement.
// Prevents the React context identity mismatch that occurs when AuthContext
// is hot-replaced while the AuthProvider instance in main.tsx still holds
// the previous context object — which would crash all useAuth() consumers.
if (import.meta.hot) {
  import.meta.hot.invalidate()
}
