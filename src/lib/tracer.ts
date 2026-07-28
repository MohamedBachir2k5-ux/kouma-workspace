const IS_DEV = import.meta.env.DEV

export interface TraceEntry {
  ts: number
  level: 'info' | 'warn' | 'error'
  module: string
  action: string
  table?: string
  error?: string
  duration_ms?: number
  userId?: string
  orgId?: string
  detail?: Record<string, unknown>
}

const buffer: TraceEntry[] = []
let _userId: string | undefined
let _orgId: string | undefined

function flush() {
  if (!IS_DEV || !buffer.length) return
  const batch = buffer.splice(0)
  fetch('/trace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
    keepalive: true,
  }).catch(() => {})
}

export function tracerSetContext(userId?: string, orgId?: string) {
  _userId = userId
  _orgId = orgId
}

export function installTracer() {
  if (!IS_DEV) return
  setInterval(flush, 500)
  window.addEventListener('beforeunload', flush)
}

export const tracer = {
  push(entry: Omit<TraceEntry, 'ts' | 'userId' | 'orgId'>) {
    if (!IS_DEV) return
    buffer.push({ ...entry, ts: Date.now(), userId: _userId, orgId: _orgId })
  },

  info(module: string, action: string, detail?: Record<string, unknown>) {
    tracer.push({ level: 'info', module, action, detail })
  },

  warn(module: string, action: string, detail?: Record<string, unknown>) {
    tracer.push({ level: 'warn', module, action, detail })
  },

  error(module: string, action: string, table?: string, error?: string, detail?: Record<string, unknown>) {
    tracer.push({ level: 'error', module, action, table, error, detail })
  },

  supabaseError(module: string, action: string, table: string, err: { message: string; code?: string; details?: string } | null | undefined) {
    if (!err) return
    tracer.push({
      level: 'error',
      module,
      action,
      table,
      error: err.message,
      detail: { code: err.code, details: err.details },
    })
  },
}
