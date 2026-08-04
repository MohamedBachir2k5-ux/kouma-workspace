import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

const solutions = [
  { to: '/solutions/communication', label: 'Communication', desc: 'Messagerie entre collaborateurs' },
  { to: '/solutions/documents', label: 'Documents', desc: 'Bibliothèque documentaire' },
  { to: '/solutions/agenda', label: 'Agenda', desc: 'Réunions et activités' },
]

export function PublicNav() {
  const [open, setOpen] = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const { pathname } = useLocation()

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <header className="sticky z-50 bg-surface/95 backdrop-blur border-b border-border" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
            <span className="text-white font-bold text-sm tracking-tight">K</span>
          </div>
          <span className="font-bold text-navy text-lg tracking-tight">Kouma</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <div className="relative" onMouseLeave={() => setSolutionsOpen(false)}>
            <button
              onMouseEnter={() => setSolutionsOpen(true)}
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/solutions') ? 'text-indigo' : 'text-muted hover:text-ink'
              }`}
            >
              Solutions
              <ChevronDown size={14} className={`transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {solutionsOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-surface border border-border rounded-xl shadow-lg shadow-black/10 overflow-hidden">
                {solutions.map(s => (
                  <Link
                    key={s.to}
                    to={s.to}
                    onClick={() => setSolutionsOpen(false)}
                    className="flex flex-col px-4 py-3 hover:bg-bg transition-colors"
                  >
                    <span className="text-sm font-medium text-ink">{s.label}</span>
                    <span className="text-xs text-muted">{s.desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/security" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/security' ? 'text-indigo' : 'text-muted hover:text-ink'}`}>
            Sécurité
          </Link>
          <Link to="/tarifs" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/tarifs' ? 'text-indigo' : 'text-muted hover:text-ink'}`}>
            Tarifs
          </Link>
          <Link to="/resources" className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/resources' ? 'text-indigo' : 'text-muted hover:text-ink'}`}>
            Ressources
          </Link>
        </nav>

        {/* Desktop action — single CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/connexion"
            className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-full hover:bg-navy-light transition-colors"
          >
            Accéder à mon espace
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-3 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-1">
          <p className="text-xs font-semibold text-faint uppercase tracking-wide px-3 py-2">Solutions</p>
          {solutions.map(s => (
            <Link key={s.to} to={s.to} onClick={() => setOpen(false)} className="flex items-center px-3 min-h-[48px] text-sm text-ink rounded-lg hover:bg-bg">
              {s.label}
            </Link>
          ))}
          <div className="h-px bg-border my-2" />
          <Link to="/security" onClick={() => setOpen(false)} className="block px-3 py-3 text-sm text-ink rounded-lg hover:bg-bg min-h-[48px] flex items-center">Sécurité</Link>
          <Link to="/tarifs" onClick={() => setOpen(false)} className="block px-3 py-3 text-sm text-ink rounded-lg hover:bg-bg min-h-[48px] flex items-center">Tarifs</Link>
          <Link to="/resources" onClick={() => setOpen(false)} className="block px-3 py-3 text-sm text-ink rounded-lg hover:bg-bg min-h-[48px] flex items-center">Ressources</Link>
          <div className="h-px bg-border my-2" />
          <Link
            to="/connexion"
            onClick={() => setOpen(false)}
            className="block w-full py-3 bg-navy text-white text-sm font-semibold rounded-xl text-center mt-2"
          >
            Accéder à mon espace
          </Link>
        </div>
      )}
    </header>
  )
}
