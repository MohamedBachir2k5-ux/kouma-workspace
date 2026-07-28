import { useState, useEffect, useRef } from 'react'
import { Search, Upload, FileText, File, Table, Plus, FolderOpen, Loader2, Download, X } from 'lucide-react'
import { DocumentService } from '../../services/document.service'
import { UserService } from '../../services/user.service'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate, formatFileSize } from '../../lib/utils'
import { Avatar } from '../../components/ui/Avatar'
import type { Document, Folder, User } from '../../lib/types'

const FOLDER_COLORS = [
  'bg-amber/10 text-amber',
  'bg-indigo/10 text-indigo',
  'bg-success/10 text-success',
  'bg-navy/10 text-navy',
  'bg-danger/10 text-danger',
]

function FileIcon({ type, size = 18 }: { type: string; size?: number }) {
  if (type === 'pdf')  return <FileText size={size} className="text-danger" />
  if (type === 'xlsx') return <Table    size={size} className="text-success" />
  if (type === 'docx') return <File     size={size} className="text-indigo" />
  return <File size={size} className="text-muted" />
}

function NewFolderModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (folder: Folder) => void
}) {
  const { currentOrg } = useAuth()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setError(null)
    const { folder, error: err } = await DocumentService.createFolder(currentOrg.id, name.trim())
    setCreating(false)
    if (err || !folder) { setError(err ?? 'Erreur création.'); return }
    onCreated(folder)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy text-base">Nouveau dossier</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">Nom du dossier</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            placeholder="Ex. Ressources Humaines"
            autoFocus
            className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
          />
        </div>
        {error && <p className="text-xs text-danger mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">Annuler</button>
          <button onClick={handleCreate} disabled={!name.trim() || creating}
            className="flex-1 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {creating ? 'Création…' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

type SpaceTab = 'personal' | 'team' | 'org'

const SPACE_TABS: { value: SpaceTab; label: string }[] = [
  { value: 'personal', label: 'Mes documents' },
  { value: 'team',     label: 'Équipes' },
  { value: 'org',      label: 'Bibliothèque' },
]

export function Documents() {
  const { currentOrg, currentUser, storageQuotaBytes } = useAuth()
  const isAdmin = currentUser.role === 'admin'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [space, setSpace] = useState<SpaceTab>('personal')
  const [query, setQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)

  useEffect(() => {
    DocumentService.list(currentOrg.id).then(setDocs)
    DocumentService.listFolders(currentOrg.id).then(setFolders)
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
  }, [currentOrg.id])

  // Merge folder IDs from docs that aren't in the folders list (legacy/hardcoded)
  const allFolderIds = [
    ...folders.map(f => f.id),
    ...docs.filter(d => d.folderId && !folders.some(f => f.id === d.folderId)).map(d => d.folderId!),
  ]
  const uniqueFolderIds = [...new Set(allFolderIds)]

  function getFolderName(id: string) {
    return folders.find(f => f.id === id)?.name ?? id
  }

  function getFolderColor(id: string) {
    const idx = uniqueFolderIds.indexOf(id)
    return FOLDER_COLORS[idx % FOLDER_COLORS.length]
  }

  const spaceDocs = docs.filter(d => {
    if (space === 'personal') return d.visibility === 'personal' && d.ownerId === currentUser.id
    if (space === 'team') return d.visibility === 'team'
    return d.visibility === 'org'
  })

  const filtered = spaceDocs.filter(doc => {
    if (query && !doc.name.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFolder && doc.folderId !== activeFolder) return false
    return true
  })

  function getUploader(id: string): User | undefined {
    return orgUsers.find(u => u.id === id)
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const currentUsed = docs.reduce((sum, d) => sum + d.size, 0)
    if (storageQuotaBytes > 0 && currentUsed + file.size > storageQuotaBytes) {
      setUploadError('Quota de stockage dépassé. Supprimez des fichiers ou passez à un plan supérieur.')
      return
    }

    setUploading(true)
    setUploadError(null)

    const uploadVisibility = space === 'org' ? 'org' : space === 'team' ? 'team' : 'personal'
    const { document: newDoc, error } = await DocumentService.uploadDocument(
      currentOrg.id,
      currentUser.id,
      file,
      undefined,
      uploadVisibility,
    )

    setUploading(false)
    if (error) { setUploadError(error); return }
    if (newDoc) setDocs(prev => [newDoc, ...prev])
  }

  async function handleDownload(doc: Document) {
    setDownloadingId(doc.id)
    setDownloadError(null)
    const { error } = await DocumentService.downloadDocument(doc.id, currentOrg.id)
    setDownloadingId(null)
    if (error) setDownloadError(error)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-ink">Documents</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || (space === 'org' && !isAdmin)}
            title={space === 'org' && !isAdmin ? 'Seuls les administrateurs peuvent importer dans la bibliothèque' : undefined}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /><span className="hidden sm:inline">Import…</span></>
              : <><Upload size={14} /><span className="hidden sm:inline">Importer</span></>
            }
          </button>
        </div>

        {/* Space tabs */}
        <div className="flex gap-1.5 mb-3">
          {SPACE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setSpace(tab.value); setActiveFolder(null) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                space === tab.value ? 'bg-navy text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {uploadError && (
          <p className="text-xs text-danger mb-2">{uploadError}</p>
        )}
        {downloadError && (
          <p className="text-xs text-danger mb-2">{downloadError}</p>
        )}

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
            {uniqueFolderIds.map(fid => (
              <button
                key={fid}
                onClick={() => setActiveFolder(activeFolder === fid ? null : fid)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  activeFolder === fid ? 'border-indigo bg-indigo-pale' : 'border-border bg-surface hover:border-indigo/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getFolderColor(fid)}`}>
                  <FolderOpen size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{getFolderName(fid)}</div>
                  <div className="text-xs text-muted">
                    {docs.filter(d => d.folderId === fid).length} fichier(s)
                  </div>
                </div>
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-indigo/40 transition-colors text-left">
                <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center">
                  <Plus size={18} className="text-muted" />
                </div>
                <span className="text-sm text-muted">Nouveau dossier</span>
              </button>
            )}
          </div>
        </div>

        {/* Files */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
              {activeFolder ? getFolderName(activeFolder) : 'Tous les fichiers'}
            </h3>
            {activeFolder && (
              <button onClick={() => setActiveFolder(null)} className="text-xs text-indigo hover:underline">Voir tout</button>
            )}
          </div>

          <div className="space-y-2">
            {filtered.map(doc => {
              const uploader = getUploader(doc.ownerId)
              const isDownloading = downloadingId === doc.id
              return (
                <button
                  key={doc.id}
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading}
                  className="w-full flex items-center gap-4 px-4 py-3.5 bg-surface rounded-xl border border-border hover:border-indigo/30 hover:shadow-sm transition-all text-left disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center shrink-0">
                    {isDownloading
                      ? <Loader2 size={18} className="text-indigo animate-spin" />
                      : <FileIcon type={doc.type} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted">{formatFileSize(doc.size)}</span>
                      <span className="text-border">·</span>
                      <span className="text-xs text-muted">{formatDate(doc.createdAt).split(' ').slice(1).join(' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {uploader && (
                      <Avatar firstName={uploader.firstName} lastName={uploader.lastName} id={uploader.id} size="sm" />
                    )}
                    <Download size={14} className="text-faint" />
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileText size={32} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">Aucun document trouvé.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 text-sm text-indigo hover:underline">
                  Importer un premier document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreated={folder => setFolders(prev => [...prev, folder])}
        />
      )}
    </div>
  )
}
