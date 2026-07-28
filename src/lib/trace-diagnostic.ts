import { tracer } from './tracer'

export function installTraceDiagnostic() {
  if (!import.meta.env.DEV) return

  // ── Navigation ──────────────────────────────────────────────────────────────
  const _push = history.pushState.bind(history)
  const _replace = history.replaceState.bind(history)
  history.pushState = (...args) => {
    _push(...args)
    tracer.info('Nav', `→ ${String(args[2] ?? window.location.pathname)}`)
  }
  history.replaceState = (...args) => {
    _replace(...args)
    tracer.info('Nav', `→ ${String(args[2] ?? window.location.pathname)}`)
  }
  window.addEventListener('popstate', () => {
    tracer.info('Nav', `← ${window.location.pathname}`)
  })

  // ── Clicks ──────────────────────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement
    const btn = el.closest('button, a[href], [role="button"]') as HTMLElement | null
    if (!btn) return
    const label = (
      btn.getAttribute('aria-label') ||
      btn.innerText?.trim().slice(0, 80) ||
      btn.getAttribute('data-testid') ||
      btn.tagName.toLowerCase()
    )
    tracer.info('Click', `"${label}"`, {
      page: window.location.pathname,
      tag: btn.tagName.toLowerCase(),
      href: btn.getAttribute('href') ?? undefined,
    })
  }, { capture: true })

  // ── Forms ───────────────────────────────────────────────────────────────────
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement
    tracer.info('Form', `submit on ${window.location.pathname}`, {
      action: form.action || window.location.pathname,
    })
  }, { capture: true })

  // ── Console errors ──────────────────────────────────────────────────────────
  const _err = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    _err(...args)
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    if (msg.includes('react-devtools') || msg.includes('Download the React')) return
    tracer.push({ level: 'error', module: 'Console', action: msg.slice(0, 400) })
  }

  // ── Unhandled promise rejections ────────────────────────────────────────────
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason ?? 'unknown')
    tracer.push({ level: 'error', module: 'Promise', action: reason.slice(0, 400) })
  })

  // ── JS runtime errors ───────────────────────────────────────────────────────
  window.addEventListener('error', (e) => {
    if (e.message?.includes('Script error')) return
    tracer.push({
      level: 'error',
      module: 'JSError',
      action: e.message,
      detail: { file: e.filename?.split('/').pop(), line: e.lineno, col: e.colno },
    })
  })
}
