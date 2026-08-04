import { useState, useEffect, useCallback, useRef } from 'react'
import { NavLink, Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { MessageSquare, FileText, Calendar, Users, User, Megaphone, Sparkles, MoreHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { Avatar } from '../ui/Avatar'
import { PWAInstallBanner } from '../ui/PWAInstallBanner'
import { PinUnlockModal } from '../ui/PinUnlockModal'
import { cryptoSession } from '../../lib/crypto-session'
import { PushService } from '../../services/push.service'
import { supabase } from '../../lib/supabase'
import type { Notification } from '../../lib/types'

function orgInitials(name: string) {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'
}

function SecurityWatermark({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ zIndex: 9999 }}
    >
      <svg
        width="100%" height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <pattern id="wm" x="0" y="0" width="260" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            <text x="0" y="60" fontSize="11" fill="rgba(0,0,0,0.022)" fontFamily="sans-serif" fontWeight="500">
              {label}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)" />
      </svg>
    </div>
  )
}

const NAV_ITEMS = [
  { to: '/app/messages',  icon: MessageSquare, key: 'nav.messages' },
  { to: '/app/annonces',  icon: Megaphone,     key: 'nav.announcements' },
  { to: '/app/documents', icon: FileText,      key: 'nav.documents' },
  { to: '/app/agenda',    icon: Calendar,      key: 'nav.agenda' },
  { to: '/app/equipes',    icon: Users,         key: 'nav.teams' },
  { to: '/app/assistant', icon: Sparkles,      key: 'nav.assistant' },
  { to: '/app/profil',    icon: User,          key: 'nav.profile' },
]

const NAV_ITEMS_MOBILE_MAIN = NAV_ITEMS.filter(i =>
  ['/app/messages', '/app/agenda', '/app/documents', '/app/equipes'].includes(i.to)
)
const NAV_ITEMS_MOBILE_MORE = NAV_ITEMS.filter(i =>
  !['/app/messages', '/app/agenda', '/app/documents', '/app/equipes'].includes(i.to)
)

function FullPageSpinner() {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function AppLayout() {
  const { t } = useTranslation()
  const { currentUser, currentOrg, loading, isOrgReady, signOut } = useAuth()
  const { checking } = useRequireAuth('/connexion/utilisateur')
  const navigate = useNavigate()
  const location = useLocation()
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const [cryptoLoaded, setCryptoLoaded] = useState(() => cryptoSession.isLoaded)

  useEffect(() => {
    if (cryptoSession.isLoaded) setCryptoLoaded(true)
  }, [isOrgReady])

  // Close "Plus" menu on route change or outside click
  useEffect(() => { setShowMore(false) }, [location.pathname])
  useEffect(() => {
    if (!showMore) return
    function onOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showMore])

  // Push subscription + browser notifications (tab hidden only)
  const showBrowserNotif = useCallback((n: Notification) => {
    if (!document.hidden) return
    if (globalThis.Notification?.permission !== 'granted') return
    new globalThis.Notification(
      n.type === 'new_message' ? t('notifications.newMessage') :
      n.type === 'meeting_invite' ? t('notifications.meetingInvite') : 'Kouma',
      { body: String(n.payload?.text ?? ''), icon: '/favicon.svg', tag: n.id }
    )
  }, [])

  useEffect(() => {
    if (!currentUser.id || currentUser.id === 'u1') return
    if (PushService.isSupported() && globalThis.Notification?.permission === 'granted') {
      PushService.isSubscribed().then(already => {
        if (!already) PushService.subscribe(currentUser.id)
      })
    }
    const key = `push-${currentUser.id}-${Math.random().toString(36).slice(2, 8)}`
    const channel = supabase.channel(key)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`,
      }, payload => {
        const r = payload.new as { id: string; user_id: string; type: string; payload: Record<string, unknown> | null; read: boolean; created_at: string }
        showBrowserNotif({ id: r.id, userId: r.user_id, type: r.type, payload: r.payload, read: r.read, createdAt: r.created_at })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUser.id, showBrowserNotif])

  if (checking || loading) return <FullPageSpinner />
  // Only redirect to /creer when authenticated but org setup is incomplete.
  // If the user is signed out (id === 'u1'), useRequireAuth handles the login redirect.
  if (!isOrgReady && currentUser.id !== 'u1') return <Navigate to="/creer" replace />

  return (
    <div className="flex flex-col h-dvh bg-bg overflow-hidden">
      {!cryptoLoaded && isOrgReady && (
        <PinUnlockModal
          userId={currentUser.id}
          orgId={currentOrg.id}
          firstName={currentUser.firstName}
          lastName={currentUser.lastName}
          email={currentUser.email}
          avatarUrl={currentUser.avatarUrl}
          isAdmin={currentUser.role === 'admin'}
          onUnlocked={() => setCryptoLoaded(true)}
          onSignOut={signOut}
        />
      )}
      {/* Top bar — mobile */}
      <header className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border shrink-0 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo flex items-center justify-center overflow-hidden shrink-0">
            {currentOrg.logoUrl
              ? <img src={currentOrg.logoUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-xs">{orgInitials(currentOrg.name)}</span>
            }
          </div>
          <span className="font-semibold text-ink text-sm">{currentOrg.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Avatar firstName={currentUser.firstName} lastName={currentUser.lastName} id={currentUser.id} size="sm" src={currentUser.avatarUrl} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-navy shrink-0 h-full">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-navy-muted shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo flex items-center justify-center overflow-hidden shrink-0">
              {currentOrg.logoUrl
                ? <img src={currentOrg.logoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-sm">{orgInitials(currentOrg.name)}</span>
              }
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm leading-tight truncate">{currentOrg.name}</div>
              <div className="text-indigo-light text-xs">Workspace</div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo text-white'
                      : 'text-indigo-light hover:bg-navy-light hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {t(key)}
              </NavLink>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-navy-muted">
            <div onClick={() => navigate('/app/profil')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-light cursor-pointer transition-colors">
              <Avatar firstName={currentUser.firstName} lastName={currentUser.lastName} id={currentUser.id} size="sm" src={currentUser.avatarUrl} />
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="text-indigo-light text-xs truncate">
                  {currentUser.role === 'admin' ? t('common.administrator') : (currentUser.jobTitle || t('common.collaborator'))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <SecurityWatermark label={`${currentUser.firstName} ${currentUser.lastName} · ${currentOrg.name}`} />
          <Outlet />
        </main>
      </div>

      <PWAInstallBanner />

      {/* Bottom nav — mobile */}
      <nav className="md:hidden flex items-stretch justify-around h-16 bg-surface border-t border-border shrink-0 px-2 safe-area-bottom relative">
        {NAV_ITEMS_MOBILE_MAIN.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-h-[44px] rounded-lg transition-colors ${
                isActive ? 'text-indigo' : 'text-faint'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{t(key)}</span>
          </NavLink>
        ))}
        <div ref={moreRef} className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowMore(v => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-h-[44px] rounded-lg transition-colors ${showMore ? 'text-indigo' : 'text-faint'}`}
          >
            <MoreHorizontal size={22} />
            <span className="text-[10px] font-medium">{t('nav.more', 'Plus')}</span>
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
              <div className="absolute bottom-14 right-0 bg-surface border border-border rounded-2xl shadow-2xl py-2 min-w-[180px] z-50">
                <div className="flex items-center justify-between px-4 py-1.5 mb-1 border-b border-border">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">{t('nav.more', 'Plus')}</span>
                  <button type="button" onClick={() => setShowMore(false)} aria-label={t('common.close')} className="text-faint hover:text-ink"><X size={13} /></button>
                </div>
                {NAV_ITEMS_MOBILE_MORE.map(({ to, icon: Icon, key }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? 'text-indigo font-semibold' : 'text-ink'}`
                    }
                  >
                    <Icon size={18} />
                    {t(key)}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
