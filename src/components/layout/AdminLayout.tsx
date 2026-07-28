import { useState } from 'react'
import { NavLink, Outlet, Link, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, UsersRound,
  HardDrive, Lock, ScrollText, Settings, Menu, X, LogOut, Megaphone,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { NotificationBell } from '../ui/NotificationBell'

function orgInitials(name: string) {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'
}

const navItems = [
  { to: '/admin/tableau-de-bord', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/admin/utilisateurs',    icon: Users,           label: 'Utilisateurs' },
  { to: '/admin/departements',    icon: Building2,       label: 'Départements' },
  { to: '/admin/equipes',         icon: UsersRound,      label: 'Équipes' },
  { to: '/admin/annonces',        icon: Megaphone,       label: 'Annonces' },
  { to: '/admin/stockage',        icon: HardDrive,       label: 'Stockage' },
  { to: '/admin/securite',        icon: Lock,            label: 'Sécurité' },
  { to: '/admin/journal',         icon: ScrollText,      label: "Journal d'activité" },
  { to: '/admin/parametres',      icon: Settings,        label: 'Paramètres' },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { currentOrg, currentUser, signOut, loading, isOrgReady } = useAuth()
  const { checking } = useRequireAuth('/connexion/admin')

  if (checking || loading) return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isOrgReady) return <Navigate to="/creer" replace />
  if (currentUser.role === 'member') return <Navigate to="/app/messages" replace />

  return (
    <div className="flex h-dvh bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-navy-muted shrink-0">
          <Link to="/admin/tableau-de-bord" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo flex items-center justify-center shrink-0 overflow-hidden">
              {currentOrg.logoUrl
                ? <img src={currentOrg.logoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-sm">{orgInitials(currentOrg.name)}</span>
              }
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">Administration</div>
              <div className="text-indigo-light text-xs truncate">{currentOrg.name}</div>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-indigo-light hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo text-white'
                    : 'text-indigo-light hover:bg-navy-light hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-navy-muted">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-light hover:bg-navy-light hover:text-white transition-colors"
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 md:h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-ink">Console d'administration</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell variant="light" />
            <div className="w-8 h-8 rounded-full bg-indigo flex items-center justify-center text-white text-xs font-bold">
              {orgInitials(currentUser.firstName + ' ' + currentUser.lastName)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
