import { useState, useEffect, useCallback, useRef } from 'react'
import { devlog, type DevLogEntry } from '../../lib/devlog'
import { Bug, X, Trash2, ChevronDown, ChevronUp, Copy, Download, Search } from 'lucide-react'

export function DebugPanel() {
  if (!import.meta.env.DEV) return null

  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<DevLogEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(() => setEntries([...devlog.getAll()].reverse()), [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('kouma:devlog', handler)
    return () => window.removeEventListener('kouma:devlog', handler)
  }, [refresh])

  const filtered = entries
    .filter(e => filter === 'all' || e.level === filter)
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.action.toLowerCase().includes(q) ||
        (e.table ?? '').toLowerCase().includes(q) ||
        (e.error ?? '').toLowerCase().includes(q) ||
        e.module.toLowerCase().includes(q)
      )
    })

  const errorCount = entries.filter(e => e.level === 'error').length
  const warnCount  = entries.filter(e => e.level === 'warn').length

  function exportLogs() {
    const json = JSON.stringify(devlog.getAll(), null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kouma-logs-${Date.now()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }

  function copyLogs() {
    const lines = devlog.getAll().map(e => {
      const ts = new Date(e.ts).toLocaleTimeString('fr-FR')
      const err = e.error ? ` | ERR: ${e.error}` : ''
      const detail = e.detail ? ` | ${JSON.stringify(e.detail)}` : ''
      return `[${ts}][${e.level.toUpperCase()}][${e.module}] ${e.action}${err}${detail}`
    }).join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const levelBg: Record<string, string> = {
    error: 'bg-red-50 border-l-2 border-red-400',
    warn:  'bg-amber-50 border-l-2 border-amber-400',
    info:  '',
  }
  const levelText: Record<string, string> = {
    error: 'text-red-600 font-semibold',
    warn:  'text-amber-700 font-medium',
    info:  'text-slate-700',
  }
  const levelDot: Record<string, string> = {
    error: 'bg-red-500',
    warn:  'bg-amber-500',
    info:  'bg-blue-400',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs select-none">
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
      >
        <Bug size={13} />
        <span className="font-semibold">DEV</span>
        {errorCount > 0 && (
          <span className="px-1 py-0.5 bg-red-500 rounded text-[9px] font-bold">{errorCount} ERR</span>
        )}
        {warnCount > 0 && errorCount === 0 && (
          <span className="px-1 py-0.5 bg-amber-500 rounded text-[9px] font-bold">{warnCount} WARN</span>
        )}
        {entries.length > 0 && errorCount === 0 && warnCount === 0 && (
          <span className="text-slate-400 text-[9px]">{entries.length}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-10 right-0 w-[580px] max-h-[75vh] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bug size={12} />
              <span className="font-semibold">Debug Log</span>
              <span className="text-slate-400 text-[10px]">{filtered.length}/{entries.length} entrées</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyLogs}
                title="Copier tous les logs"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <Copy size={10} />
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button
                onClick={exportLogs}
                title="Exporter en JSON"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <Download size={10} />
                Export
              </button>
              <button
                onClick={() => { devlog.clear(); refresh(); setExpanded(null) }}
                title="Vider les logs"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <Trash2 size={10} />
                Vider
              </button>
              <button onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100 ml-1">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="flex gap-1">
              {(['all', 'error', 'warn', 'info'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors ${
                    filter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200'
                  }`}>
                  {f}
                  {f === 'error' && errorCount > 0 && ` (${errorCount})`}
                  {f === 'warn'  && warnCount  > 0 && ` (${warnCount})`}
                </button>
              ))}
            </div>
            <div className="flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
              <Search size={9} className="text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="filtrer…"
                className="flex-1 bg-transparent outline-none text-[10px] text-slate-700 placeholder:text-slate-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                  <X size={9} />
                </button>
              )}
            </div>
          </div>

          {/* Log entries */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-[10px]">
                {entries.length === 0 ? 'Aucune action tracée.' : 'Aucun résultat pour ce filtre.'}
              </div>
            ) : (
              filtered.map((e, i) => (
                <div key={i} className={`border-b border-slate-100 ${levelBg[e.level]}`}>
                  <button
                    onClick={() => setExpanded(prev => prev === i ? null : i)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-slate-50/80 transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${levelDot[e.level]}`} />
                    <span className="text-slate-400 shrink-0 text-[9px] tabular-nums">
                      {new Date(e.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-slate-500 shrink-0 text-[9px]">[{e.module}]</span>
                    {e.table && e.table !== e.action && (
                      <span className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] shrink-0">{e.table}</span>
                    )}
                    <span className={`flex-1 truncate ${levelText[e.level]}`}>{e.action}</span>
                    {e.error && (
                      <span className="shrink-0 text-red-500 truncate max-w-[180px] text-[9px]">{e.error}</span>
                    )}
                    {e.detail?.duration_ms !== undefined && (
                      <span className="text-slate-400 shrink-0 text-[9px]">{String(e.detail.duration_ms)}ms</span>
                    )}
                    {expanded === i
                      ? <ChevronUp size={9} className="shrink-0 text-slate-400" />
                      : <ChevronDown size={9} className="shrink-0 text-slate-400" />
                    }
                  </button>

                  {expanded === i && (
                    <div className="px-5 pb-2 pt-0.5 space-y-1 bg-slate-50/50">
                      {e.error && (
                        <div className="text-red-600 font-semibold text-[10px]">⚠ {e.error}</div>
                      )}
                      {e.detail && (
                        <pre className="bg-white border border-slate-100 rounded p-2 text-[9px] text-slate-700 overflow-x-auto max-h-40 leading-relaxed">
                          {JSON.stringify(e.detail, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer: quick stats */}
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center gap-3 text-[9px] text-slate-500">
            <span>{entries.filter(e => e.module === 'Supabase').length} requêtes DB</span>
            <span>{errorCount} erreurs</span>
            <span>{warnCount} warnings</span>
            <span className="ml-auto">Session {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
