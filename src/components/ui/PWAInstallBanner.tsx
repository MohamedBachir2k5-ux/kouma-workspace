import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'kouma_pwa_dismissed'

export function PWAInstallBanner() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // The event may have fired before React mounted — read from global
    const captured = (window as Window & { __pwa_prompt?: Event }).__pwa_prompt
    if (captured) {
      setDeferredPrompt(captured as BeforeInstallPromptEvent)
      setVisible(true)
      return
    }

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible || !deferredPrompt) return null

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setVisible(false)
    setDeferredPrompt(null)
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-navy text-white rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4">
      <div className="w-9 h-9 bg-indigo rounded-xl flex items-center justify-center shrink-0">
        <Download size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{t('pwa.bannerTitle')}</div>
        <div className="text-xs text-indigo-light mt-0.5">{t('pwa.bannerDesc')}</div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={install}
            className="px-3 py-1.5 bg-indigo text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('pwa.install')}
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-indigo-light text-xs font-medium rounded-lg hover:text-white transition-colors"
          >
            {t('pwa.later')}
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="text-indigo-light hover:text-white shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
