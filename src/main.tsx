import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n/index'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { installTracer } from './lib/tracer'
import { installTraceInterceptor } from './lib/trace-interceptor'
import { installTraceDiagnostic } from './lib/trace-diagnostic'
import { supabase } from './lib/supabase'

// ── Sentry (only when VITE_SENTRY_DSN is set in production) ─────────────────
if (!import.meta.env.DEV && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    environment: (import.meta.env.VITE_APP_ENV as string) ?? 'production',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
  })
}

// ── Fallback: log uncaught errors to Supabase (works with or without Sentry) ─
function reportError(message: string, stack?: string) {
  if (import.meta.env.DEV) return
  supabase.rpc('log_client_error', {
    p_message: message,
    p_stack: stack,
    p_url: window.location.href,
    p_user_agent: navigator.userAgent,
  }).then(() => {})
}

window.addEventListener('error', (e) => {
  reportError(e.message, e.error?.stack)
})

window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason instanceof Error ? e.reason.message : String(e.reason)
  const stack = e.reason instanceof Error ? e.reason.stack : undefined
  reportError(msg, stack)
})

// ── Dev tooling ──────────────────────────────────────────────────────────────
installTracer()
installTraceInterceptor()
installTraceDiagnostic()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}

// Warn loudly in production if push notifications will silently fail
if (!import.meta.env.DEV && !import.meta.env.VITE_VAPID_PUBLIC_KEY) {
  console.error('[Kouma] VITE_VAPID_PUBLIC_KEY is not set — push notifications are disabled. Set this variable in your production environment.')
  reportError('VITE_VAPID_PUBLIC_KEY is not set — push notifications are silently disabled.')
}

// Capture beforeinstallprompt before React mounts — the event fires once, early
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  ;(window as Window & { __pwa_prompt?: Event }).__pwa_prompt = e
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
