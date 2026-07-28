import { devlog } from './devlog'

const _key = '__kouma_diag_installed__'

export function installDiagnostics() {
  if (!import.meta.env.DEV) return
  if ((window as unknown as Record<string, unknown>)[_key]) return
  ;(window as unknown as Record<string, unknown>)[_key] = true

  // ── Navigation tracking ───────────────────────────────────────────────────
  const _pushState = history.pushState.bind(history)
  const _replaceState = history.replaceState.bind(history)

  history.pushState = (...args) => {
    _pushState(...args)
    devlog.info('Navigation', `→ ${args[2] ?? window.location.pathname}`)
  }
  history.replaceState = (...args) => {
    _replaceState(...args)
    devlog.info('Navigation', `→ ${args[2] ?? window.location.pathname}`)
  }
  window.addEventListener('popstate', () => {
    devlog.info('Navigation', `← ${window.location.pathname}`)
  })

  // ── Click tracking ────────────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement
    const btn = el.closest('button, a, [role="button"]') as HTMLElement | null
    if (!btn) return
    const label = (
      btn.getAttribute('aria-label') ||
      btn.innerText?.trim().slice(0, 60) ||
      btn.getAttribute('data-testid') ||
      btn.tagName.toLowerCase()
    )
    const page = window.location.pathname
    devlog.info('Click', `"${label}"`, { page, tag: btn.tagName.toLowerCase() })
  }, { capture: true })

  // ── Form submissions ──────────────────────────────────────────────────────
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement
    const page = window.location.pathname
    devlog.info('Form', `submit on ${page}`, { action: form.action || page })
  }, { capture: true })

  // ── Console.error override ────────────────────────────────────────────────
  const _consoleError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    _consoleError(...args)
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
    // Skip React DevTools noise
    if (msg.includes('react-devtools') || msg.includes('Download the React')) return
    devlog.error('Console', msg.slice(0, 300))
  }

  // ── Unhandled promise rejections ──────────────────────────────────────────
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error
      ? e.reason.message
      : String(e.reason ?? 'unknown')
    devlog.error('UnhandledRejection', reason.slice(0, 300))
  })

  // ── JS runtime errors ─────────────────────────────────────────────────────
  window.addEventListener('error', (e) => {
    if (e.message?.includes('Script error')) return
    devlog.error('JSError', e.message, e.filename?.split('/').pop(), undefined, {
      line: e.lineno,
      col: e.colno,
      file: e.filename?.split('/').pop(),
    })
  })

  // diagnostic installed — no log emitted to avoid HMR noise
}
