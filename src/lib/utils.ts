const LANG_TO_LOCALE: Record<string, string> = {
  fr: 'fr-FR', en: 'en-US', es: 'es-ES', pt: 'pt-BR',
}
function appLocale(): string {
  const lang = localStorage.getItem('kouma_lang') ?? 'fr'
  return LANG_TO_LOCALE[lang] ?? 'fr-FR'
}

export function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const locale = appLocale()

  if (mins < 1) return locale.startsWith('fr') ? 'À l\'instant' : locale.startsWith('es') ? 'Ahora' : locale.startsWith('pt') ? 'Agora' : 'Just now'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}${locale.startsWith('en') ? 'd' : 'j'}`
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(appLocale(), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function relativeDay(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days  = Math.floor(diff / 86_400_000)
  const hours = Math.floor(diff / 3_600_000)
  const mins  = Math.floor(diff / 60_000)
  const lang = localStorage.getItem('kouma_lang') ?? 'fr'
  if (lang === 'en') {
    if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0)  return `${mins} min ago`
    return 'just now'
  }
  if (lang === 'es') {
    if (days > 0)  return `hace ${days} día${days > 1 ? 's' : ''}`
    if (hours > 0) return `hace ${hours}h`
    if (mins > 0)  return `hace ${mins} min`
    return 'ahora'
  }
  if (lang === 'pt') {
    if (days > 0)  return `há ${days} dia${days > 1 ? 's' : ''}`
    if (hours > 0) return `há ${hours}h`
    if (mins > 0)  return `há ${mins} min`
    return 'agora'
  }
  if (days > 0)  return `il y a ${days} jour${days > 1 ? 's' : ''}`
  if (hours > 0) return `il y a ${hours}h`
  if (mins > 0)  return `il y a ${mins} min`
  return 'à l\'instant'
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(appLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
}

export function initials(firstName: string, lastName: string): string {
  const f = firstName?.[0] ?? ''
  const l = lastName?.[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

export function avatarColor(id: string): string {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-teal-500',
  ]
  const idx = id.charCodeAt(id.length - 1) % colors.length
  return colors[idx]
}
