import { Link } from 'react-router-dom'
import { User, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { AuthBrandPanel, MobileAuthStrip } from '../../components/layout/AuthBrandPanel'

export function LoginSelector() {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh flex overflow-hidden">
      <AuthBrandPanel />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <MobileAuthStrip />

        <div className="flex-1 bg-bg flex flex-col items-center justify-center px-6 py-12 safe-area-bottom">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
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
          </motion.div>
        </div>
      </div>
    </div>
  )
}
