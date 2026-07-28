const IS_DEV = import.meta.env.DEV

export interface DevLogEntry {
  ts: number
  level: 'info' | 'warn' | 'error'
  module: string
  action: string
  table?: string
  error?: string
  detail?: Record<string, unknown>
}

const MAX_ENTRIES = 200
const STORAGE_KEY = '__kouma_devlog__'

function load(): DevLogEntry[] {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function save(entries: DevLogEntry[]) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES))) } catch {}
}

export const devlog = {
  push(entry: Omit<DevLogEntry, 'ts'>) {
    if (!IS_DEV) return
    const full: DevLogEntry = { ...entry, ts: Date.now() }
    const entries = load()
    entries.push(full)
    save(entries)
    if (entry.level === 'error') {
      console.error(`[DEV][${entry.module}] ${entry.action}`, entry.error, entry.detail)
    } else if (entry.level === 'warn') {
      console.warn(`[DEV][${entry.module}] ${entry.action}`, entry.detail)
    }
    window.dispatchEvent(new CustomEvent('kouma:devlog', { detail: full }))
    // Send to Vite dev server — written to test/e2e/live.ndjson (readable by Claude)
    fetch('/devlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
    }).catch(() => {})
  },

  info(module: string, action: string, detail?: Record<string, unknown>) {
    devlog.push({ level: 'info', module, action, detail })
  },

  warn(module: string, action: string, detail?: Record<string, unknown>) {
    devlog.push({ level: 'warn', module, action, detail })
  },

  error(module: string, action: string, table?: string, error?: string, detail?: Record<string, unknown>) {
    devlog.push({ level: 'error', module, action, table, error, detail })
  },

  supabaseError(module: string, action: string, table: string, error: { message: string; code?: string; details?: string } | null | undefined) {
    if (!error) return
    devlog.push({
      level: 'error',
      module,
      action,
      table,
      error: error.message,
      detail: { code: error.code, details: error.details },
    })
  },

  getAll(): DevLogEntry[] { return load() },
  clear() { sessionStorage.removeItem(STORAGE_KEY) },
}
