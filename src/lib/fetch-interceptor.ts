import { devlog } from './devlog'

const SUPA_HOST = import.meta.env.VITE_SUPABASE_URL as string

// Extract table name from PostgREST URL like /rest/v1/messages?...
function parseTable(url: string): string {
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean)
    const restIdx = seg.indexOf('v1')
    return restIdx >= 0 ? (seg[restIdx + 1] ?? url) : url
  } catch {
    return url
  }
}

function httpMethodToOp(method: string, url: string): string {
  const m = method.toUpperCase()
  if (m === 'GET')    return 'SELECT'
  if (m === 'POST')   return url.includes('/rpc/') ? 'RPC' : 'INSERT'
  if (m === 'PATCH')  return 'UPDATE'
  if (m === 'DELETE') return 'DELETE'
  return m
}

const _originalFetch = window.fetch.bind(window)

export function installFetchInterceptor() {
  if (!import.meta.env.DEV) return

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const isSupabase = url.includes(SUPA_HOST) || url.includes('54331') || url.includes('54332')

    if (!isSupabase) return _originalFetch(input, init)

    const method = (init?.method ?? 'GET').toUpperCase()
    const isRpc = url.includes('/rpc/')
    const table = isRpc ? url.split('/rpc/')[1]?.split('?')[0] : parseTable(url)
    const op = httpMethodToOp(method, url)
    const t0 = Date.now()

    let body: unknown = undefined
    try {
      if (init?.body && typeof init.body === 'string') body = JSON.parse(init.body)
    } catch {}

    try {
      const response = await _originalFetch(input, init)
      const duration = Date.now() - t0
      const cloned = response.clone()

      cloned.json().then((json: unknown) => {
        const isError = !response.ok
        const isRlsError = response.status === 403 || (
          typeof json === 'object' && json !== null &&
          'code' in json && (
            String((json as Record<string, unknown>).code) === '42501' ||
            String((json as Record<string, unknown>).message ?? '').toLowerCase().includes('permission')
          )
        )

        if (isError || isRlsError) {
          const errorMsg = typeof json === 'object' && json !== null
            ? String((json as Record<string, unknown>).message ?? (json as Record<string, unknown>).hint ?? response.status)
            : String(response.status)

          devlog.push({
            ts: t0,
            level: isRlsError ? 'error' : 'warn',
            module: 'Supabase',
            action: `${op} ${table} → HTTP ${response.status}`,
            table,
            error: errorMsg,
            detail: {
              method,
              url: url.replace(SUPA_HOST, ''),
              status: response.status,
              duration_ms: duration,
              body,
              response: json,
            },
          })
        } else {
          const count = Array.isArray(json) ? json.length : undefined
          devlog.push({
            ts: t0,
            level: 'info',
            module: 'Supabase',
            action: `${op} ${table}${count !== undefined ? ` → ${count} row(s)` : ''}`,
            table,
            detail: {
              method,
              url: url.replace(SUPA_HOST, ''),
              status: response.status,
              duration_ms: duration,
              body,
            },
          })
        }
      }).catch(() => {
        // Non-JSON response (storage upload, etc.) — log as info
        devlog.push({
          ts: t0,
          level: 'info',
          module: 'Supabase',
          action: `${op} ${table} → HTTP ${response.status}`,
          table,
          detail: { method, url: url.replace(SUPA_HOST, ''), status: response.status, duration_ms: Date.now() - t0 },
        })
      })

      return response
    } catch (err) {
      devlog.push({
        ts: t0,
        level: 'error',
        module: 'Supabase',
        action: `${op} ${table} → NETWORK ERROR`,
        table,
        error: String((err as Error).message),
        detail: { method, url, body },
      })
      throw err
    }
  }
}
