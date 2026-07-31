import { supabase } from './supabase'
import { tracer } from './tracer'

const SUPA_HOST = import.meta.env.VITE_SUPABASE_URL as string
const _fetch = window.fetch.bind(window)

function parseTable(url: string): string {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean)
    const idx = seg.indexOf('v1')
    return idx >= 0 ? (seg[idx + 1] ?? url) : url
  } catch { return url }
}

function toOp(method: string, url: string): string {
  const m = method.toUpperCase()
  if (m === 'GET')    return 'SELECT'
  if (m === 'POST')   return url.includes('/rpc/') ? 'RPC' : 'INSERT'
  if (m === 'PATCH')  return 'UPDATE'
  if (m === 'DELETE') return 'DELETE'
  return m
}

export function installTraceInterceptor() {
  const isDev = import.meta.env.DEV

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const isSupabase = url.includes(SUPA_HOST) || url.includes('54331') || url.includes('54332')

    // Anti-recursion: don't intercept our own error-logging calls
    if (url.includes('rpc/log_client_error')) return _fetch(input, init)

    if (!isSupabase) return _fetch(input, init)

    const method = (init?.method ?? 'GET').toUpperCase()
    const isRpc = url.includes('/rpc/')
    const table = isRpc ? (url.split('/rpc/')[1]?.split('?')[0] ?? '') : parseTable(url)
    const op = toOp(method, url)
    const t0 = Date.now()

    let reqBody: unknown
    if (isDev) {
      try { if (init?.body && typeof init.body === 'string') reqBody = JSON.parse(init.body) } catch {}
    }

    try {
      const res = await _fetch(input, init)
      const duration_ms = Date.now() - t0

      res.clone().json().then((json: unknown) => {
        const isRls = res.status === 403 || (
          typeof json === 'object' && json !== null && 'code' in json &&
          (String((json as Record<string,unknown>).code) === '42501' ||
           String((json as Record<string,unknown>).message ?? '').toLowerCase().includes('permission'))
        )
        const isErr = !res.ok || isRls

        if (isErr) {
          const errMsg = typeof json === 'object' && json !== null
            ? String((json as Record<string,unknown>).message ?? (json as Record<string,unknown>).hint ?? res.status)
            : String(res.status)

          if (isDev) {
            tracer.push({
              level: isRls ? 'error' : 'warn',
              module: 'Supabase',
              action: `${op} ${table}`,
              table,
              error: errMsg,
              duration_ms,
              detail: {
                method, status: res.status,
                url: url.replace(SUPA_HOST, ''),
                body: reqBody,
                response: json,
                rls: isRls,
              },
            })
          } else if (isRls || res.status >= 500) {
            // Production: log RLS violations and server errors to client_errors
            supabase.rpc('log_client_error', {
              p_message: `[RLS/ERR] ${op} ${table}: ${errMsg.slice(0, 200)}`,
              p_url: url.replace(SUPA_HOST, '').split('?')[0],
              p_user_agent: navigator.userAgent,
            }).then(() => {})
          }
        } else if (isDev) {
          const count = Array.isArray(json) ? json.length : undefined
          tracer.push({
            level: 'info',
            module: 'Supabase',
            action: `${op} ${table}${count !== undefined ? ` (${count})` : ''}`,
            table,
            duration_ms,
            detail: {
              method, status: res.status,
              url: url.replace(SUPA_HOST, ''),
              ...(method !== 'GET' ? { body: reqBody } : {}),
            },
          })
        }
      }).catch(() => {
        if (isDev) {
          tracer.push({
            level: 'info',
            module: 'Supabase',
            action: `${op} ${table} → ${res.status}`,
            table,
            duration_ms,
            detail: { method, status: res.status, url: url.replace(SUPA_HOST, '') },
          })
        }
      })

      return res
    } catch (err) {
      if (isDev) {
        tracer.push({
          level: 'error',
          module: 'Supabase',
          action: `${op} ${table} → NETWORK ERROR`,
          table,
          error: String((err as Error).message),
          duration_ms: Date.now() - t0,
          detail: { method, url, body: reqBody },
        })
      }
      throw err
    }
  }
}
