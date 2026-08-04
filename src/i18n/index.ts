import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import fr from './locales/fr.json'
import en from './locales/en.json'
import es from './locales/es.json'
import pt from './locales/pt.json'

export type SupportedLocale = 'fr' | 'en' | 'es' | 'pt'

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  pt: 'Português',
}

const SUPPORTED: SupportedLocale[] = ['fr', 'en', 'es', 'pt']
const saved = localStorage.getItem('kouma_lang') ?? 'fr'
const initialLang: SupportedLocale = (SUPPORTED as string[]).includes(saved) ? (saved as SupportedLocale) : 'fr'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
    },
    lng: initialLang,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

document.documentElement.lang = initialLang
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n
