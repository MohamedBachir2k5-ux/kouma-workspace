import { Link } from 'react-router-dom'
import { User, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function LoginSelector() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12 safe-area-bottom">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
          <span className="text-white font-bold text-base">K</span>
        </div>
        <div>
          <span className="font-bold text-navy text-xl tracking-tight">Kouma</span>
          <span className="block text-xs text-muted leading-none">by Goundo</span>
        </div>
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-navy text-center mb-1.5">{t('auth.selectorTitle')}</h1>
        <p className="text-muted text-sm text-center mb-10">{t('auth.selectorSubtitle')}</p>

        <Link
          to="/connexion/utilisateur"
          className="flex items-center gap-4 p-5 bg-surface rounded-2xl border border-border hover:border-indigo hover:shadow-lg hover:shadow-indigo/5 transition-all group mb-4"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-pale flex items-center justify-center shrink-0 group-hover:bg-indigo transition-colors">
            <User size={22} className="text-indigo group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-ink mb-0.5">{t('auth.collaboratorLabel')}</div>
            <div className="text-sm text-muted">{t('auth.collaboratorDesc')}</div>
          </div>
          <ChevronRight size={18} className="text-faint group-hover:text-indigo transition-colors shrink-0" />
        </Link>

        <div className="mt-10 space-y-1 text-center">
          <Link to="/connexion/admin" className="flex items-center justify-center min-h-[48px] text-xs text-muted font-medium hover:text-ink transition-colors">
            {t('auth.adminQuestion')} {t('auth.accessConsole')}
          </Link>
          <Link to="/creer" className="flex items-center justify-center min-h-[48px] text-xs text-indigo font-medium hover:underline">
            {t('auth.createWorkspace')}
          </Link>
        </div>
      </div>
    </div>
  )
}
