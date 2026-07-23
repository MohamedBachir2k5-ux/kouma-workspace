import { Link } from 'react-router-dom'
import { User } from 'lucide-react'

export function LoginSelector() {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <div>
          <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
          <span className="block text-[10px] text-muted leading-none">by Goundo</span>
        </div>
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-navy text-center mb-1.5">Accéder à mon espace</h1>
        <p className="text-muted text-sm text-center mb-10">Entrez vos identifiants pour continuer.</p>

        <Link
          to="/connexion/utilisateur"
          className="flex items-center gap-4 p-5 bg-surface rounded-2xl border border-border hover:border-indigo hover:shadow-lg hover:shadow-indigo/5 transition-all group mb-4"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-pale flex items-center justify-center shrink-0 group-hover:bg-indigo transition-colors">
            <User size={22} className="text-indigo group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-ink mb-0.5">Collaborateur</div>
            <div className="text-sm text-muted">Email et code PIN à 6 chiffres</div>
          </div>
          <svg className="text-faint group-hover:text-indigo transition-colors shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>

        <p className="mt-10 text-center text-xs text-faint">
          Administrateur ?{' '}
          <Link to="/connexion/admin" className="text-muted font-medium hover:text-ink">Accéder à la console</Link>
        </p>

        <p className="mt-4 text-center text-xs text-faint">
          Pas encore de workspace ?{' '}
          <Link to="/creer" className="text-indigo font-medium hover:underline">En créer un</Link>
        </p>
      </div>
    </div>
  )
}
