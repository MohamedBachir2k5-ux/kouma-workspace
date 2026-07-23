import { useState } from 'react'
import { Search, Upload, FileText, File, Table, Plus, FolderOpen } from 'lucide-react'
import { mockOrgUsers } from '../../lib/mock'
import { DocumentService } from '../../services/document.service'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate, formatFileSize } from '../../lib/utils'
import { Avatar } from '../../components/ui/Avatar'

const folderColors: Record<string, string> = {
  f1: 'bg-amber/10 text-amber',
  f2: 'bg-indigo/10 text-indigo',
}

const folderNames: Record<string, string> = {
  f1: 'Finance',
  f2: 'Ressources Humaines',
}

function FileIcon({ type, size = 18 }: { type: string; size?: number }) {
  if (type === 'pdf') return <FileText size={size} className="text-danger" />
  if (type === 'xlsx') return <Table size={size} className="text-success" />
  if (type === 'docx') return <File size={size} className="text-indigo" />
  return <File size={size} className="text-muted" />
}

export function Documents() {
  const { currentOrg } = useAuth()
  const [query, setQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)

  const docs = DocumentService.list(currentOrg.id)
  const folders = [...new Set(docs.filter(d => d.folderId).map(d => d.folderId!))]

  const filtered = docs.filter(doc => {
    if (query && !doc.name.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFolder && doc.folderId !== activeFolder) return false
    return true
  })

  function getUploader(id: string) {
    return mockOrgUsers.find(u => u.id === id)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-ink">Documents</h2>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
            <Upload size={14} />
            <span className="hidden sm:inline">Importer</span>
          </button>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
          />
        </div>
      </div>

      <div className="px-4 py-4 max-w-3xl">
        {/* Folders */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Dossiers</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {folders.map(fid => (
              <button
                key={fid}
                onClick={() => setActiveFolder(activeFolder === fid ? null : fid)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  activeFolder === fid ? 'border-indigo bg-indigo-pale' : 'border-border bg-surface hover:border-indigo/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${folderColors[fid] || 'bg-muted/10 text-muted'}`}>
                  <FolderOpen size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{folderNames[fid] || fid}</div>
                  <div className="text-xs text-muted">
                    {docs.filter(d => d.folderId === fid).length} fichier(s)
                  </div>
                </div>
              </button>
            ))}
            <button className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-indigo/40 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center">
                <Plus size={18} className="text-muted" />
              </div>
              <span className="text-sm text-muted">Nouveau dossier</span>
            </button>
          </div>
        </div>

        {/* Files */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
              {activeFolder ? folderNames[activeFolder] : 'Tous les fichiers'}
            </h3>
            {activeFolder && (
              <button onClick={() => setActiveFolder(null)} className="text-xs text-indigo hover:underline">Voir tout</button>
            )}
          </div>

          <div className="space-y-2">
            {filtered.map(doc => {
              const uploader = getUploader(doc.ownerId)
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-4 py-3.5 bg-surface rounded-xl border border-border hover:border-indigo/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center shrink-0">
                    <FileIcon type={doc.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted">{formatFileSize(doc.size)}</span>
                      <span className="text-border">·</span>
                      <span className="text-xs text-muted">{formatDate(doc.createdAt).split(' ').slice(1).join(' ')}</span>
                    </div>
                  </div>
                  {uploader && (
                    <Avatar firstName={uploader.firstName} lastName={uploader.lastName} id={uploader.id} size="sm" />
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileText size={32} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">Aucun document trouvé.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
