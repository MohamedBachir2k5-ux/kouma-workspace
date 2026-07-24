import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { MessageSquare, FileText, Calendar, Users, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { Avatar } from '../ui/Avatar'
import { NotificationBell } from '../ui/NotificationBell'

function orgInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const NAV_ITEMS = [
  { to: '/app/messages', icon: MessageSquare, key: 'nav.messages' },
  { to: '/app/documents', icon: FileText,      key: 'nav.documents' },
  { to: '/app/agenda',    icon: Calendar,       key: 'nav.agenda' },
  { to: '/app/equipes',   icon: Users,          key: 'nav.teams' },
  { to: '/app/profil',    icon: User,           key: 'nav.profile' },
]

export function AppLayout() {
  const { t } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const { checking } = useRequireAuth('/connexion/utilisateur')
  const navigate = useNavigate()

  if (checking) return null

  return (
    <div className="flex flex-col h-dvh bg-bg">
      {/* Top bar — mobile */}
      <header className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border shrink-0 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo flex items-center justify-center">
            <span className="text-white font-bold text-xs">{orgInitials(currentOrg.name)}</span>
          </div>
          <span className="font-semibold text-ink text-sm">{currentOrg.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell variant="light" />
          <Avatar firstName={currentUser.firstName} lastName={currentUser.lastName} id={currentUser.id} size="sm" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-navy shrink-0 h-full">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-navy-muted shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo flex items-center justify-center">
              <span className="text-white font-bold text-sm">{orgInitials(currentOrg.name)}</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">{currentOrg.name}</div>
              <div className="text-indigo-light text-xs">Workspace</div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
            <div className="flex items-center gap-2 px-1 mb-1">
              <NotificationBell variant="dark" />
            </div>
            <div onClick={() => navigate('/app/profil')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-light cursor-pointer transition-colors">
              <Avatar firstName={currentUser.firstName} lastName={currentUser.lastName} id={currentUser.id} size="sm" />
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="text-indigo-light text-xs truncate">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden flex items-center justify-around h-16 bg-surface border-t border-border shrink-0 px-2 safe-area-bottom">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-indigo' : 'text-faint'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
