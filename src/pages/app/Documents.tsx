import { useState, useEffect, useRef } from 'react'
import { Search, Upload, FileText, File, Table, Plus, FolderOpen, Loader2, Download, X, Users, BookOpen, Trash2, ChevronRight, Folder as FolderIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DocumentService } from '../../services/document.service'
import { UserService } from '../../services/user.service'
import { TeamService } from '../../services/team.service'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate, formatFileSize } from '../../lib/utils'
import { Avatar } from '../../components/ui/Avatar'
import type { Document, Folder, User, Team } from '../../lib/types'

const ACCEPTED_FORMATS = 'PDF, Word, Excel, PowerPoint, images (PNG, JPG, GIF, WebP), text, CSV, ZIP'
const MAX_SIZE_LABEL = '50 MB max'

const FOLDER_COLORS = [
  'bg-amber/10 text-amber',
  'bg-indigo/10 text-indigo',
  'bg-success/10 text-success',
  'bg-navy/10 text-navy',
  'bg-danger/10 text-danger',
]

function FileIcon({ type, size = 18 }: { type: string; size?: number }) {
  if (type === 'pdf')  return <FileText size={size} className="text-danger" />
  if (['xlsx', 'xls', 'csv'].includes(type)) return <Table size={size} className="text-success" />
  if (['docx', 'doc'].includes(type)) return <File size={size} className="text-indigo" />
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(type)) return <File size={size} className="text-amber" />
  return <File size={size} className="text-muted" />
}

function friendlyUploadError(raw: string, t: (key: string, opts?: Record<string, string>) => string): string {
  if (raw.includes('mime') || raw.includes('MIME') || raw.includes('type') || raw.includes('format')) {
    return t('documents.formatError', { formats: ACCEPTED_FORMATS })
  }
  if (raw.includes('size') || raw.includes('large') || raw.includes('volumineux')) {
    return t('documents.sizeError', { limit: MAX_SIZE_LABEL })
  }
  if (raw.includes('quota') || raw.includes('storage')) {
    return t('documents.quotaExceeded')
  }
  return raw
}

/* ── In-app document viewer ── */
function DocumentPreviewModal({ docId, docName, docType, orgId, onClose, onDownload }: {
  docId: string; docName: string; docType: string; orgId: string
  onClose: () => void; onDownload: () => void
}) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const isImage = /^(png|jpg|jpeg|gif|webp|svg)$/i.test(docType)
  const isPdf = docType === 'pdf'
  const canPreview = isImage || isPdf

  useEffect(() => {
    if (!canPreview) { setLoading(false); return }
    let blobUrl: string | null = null
    DocumentService.getDocumentPreviewUrl(docId, orgId).then(res => {
      setLoading(false)
      if (res.error || !res.url) { setError(res.error ?? null); return }
      blobUrl = res.url
      setUrl(res.url)
    })
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [docId])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface/10 border-b border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <FileIcon type={docType} size={16} />
          <span className="text-sm font-semibold text-white truncate max-w-xs">{docName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            <Download size={13} /> {t('common.download')}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {loading && <Loader2 size={28} className="text-white/60 animate-spin" />}
        {error && <p className="text-white/60 text-sm">{error}</p>}
        {!loading && !error && !canPreview && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <FileIcon type={docType} size={32} />
            </div>
            <p className="text-white/60 text-sm mb-4">{t('documents.previewUnavailable')}</p>
            <button onClick={onDownload} className="px-5 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90">
              {t('documents.downloadFile')}
            </button>
          </div>
        )}
        {!loading && url && isImage && (
          <img src={url} alt={docName} className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" />
        )}
        {!loading && url && isPdf && (
          <iframe src={url} title={docName} className="w-full h-full rounded-xl bg-white shadow-2xl" style={{ minHeight: '70vh' }} />
        )}
      </div>
    </div>
  )
}

function NewFolderModal({ defaultVisibility = 'personal', onClose, onCreated }: {
  defaultVisibility?: 'personal' | 'org'
  onClose: () => void
  onCreated: (folder: Folder) => void
}) {
  const { t } = useTranslation()
  const { currentOrg } = useAuth()
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'personal' | 'org'>(defaultVisibility)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setError(null)
    const { folder, error: err } = await DocumentService.createFolder(currentOrg.id, name.trim(), visibility)
    setCreating(false)
    if (err || !folder) { setError(err ?? t('documents.folderCreationError')); return }
    onCreated(folder)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy text-base">{t('documents.newFolder')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('documents.folderName')}</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            placeholder={t('documents.folderNamePlaceholder')}
            autoFocus
            className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('documents.visibility')}</label>
          <div className="flex gap-2">
            {(['personal', 'org'] as const).map(v => (
              <button key={v} type="button" onClick={() => setVisibility(v)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${visibility === v ? 'bg-indigo text-white border-indigo' : 'bg-bg border-border text-muted hover:border-indigo/40'}`}>
                {v === 'personal' ? `🔒 ${t('documents.visibilityPersonal')}` : `🏢 ${t('documents.visibilityOrg')}`}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-faint mt-1.5">
            {visibility === 'personal' ? t('documents.visibilityPersonalHint') : t('documents.visibilityOrgHint')}
          </p>
        </div>
        {error && <p className="text-xs text-danger mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button onClick={handleCreate} disabled={!name.trim() || creating}
            className="flex-1 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {creating ? t('assistant.creating') : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  )
}

type SpaceTab = 'personal' | 'team' | 'org'

export function Documents() {
  const { t } = useTranslation()
  const { currentOrg, currentUser, storageQuotaBytes } = useAuth()
  const isAdmin = currentUser.role === 'admin'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const SPACE_TABS: { value: SpaceTab; label: string; icon: typeof FileText }[] = [
    { value: 'personal', label: t('documents.myDocs'),  icon: FileText },
    { value: 'team',     label: t('documents.teamDocs'), icon: Users },
    { value: 'org',      label: t('documents.orgDocs'),  icon: BookOpen },
  ]

  const [space, setSpace] = useState<SpaceTab>('personal')
  const [query, setQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  useEffect(() => {
    DocumentService.list(currentOrg.id).then(setDocs)
    DocumentService.listFolders(currentOrg.id).then(setFolders)
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
    TeamService.getByOrganizationWithMembers(currentOrg.id).then(teams => {
      const mine = isAdmin
        ? teams
        : teams.filter(t => t.members.includes(currentUser.id))
      setMyTeams(mine)
      if (mine.length > 0 && !selectedTeamId) setSelectedTeamId(mine[0].id)
    })
  }, [currentOrg.id])

  const spaceDocs = docs.filter(d => {
    if (space === 'personal') return d.visibility === 'personal' && d.ownerId === currentUser.id
    if (space === 'team') {
      if (!selectedTeamId) return false
      return d.visibility === 'team' && d.teamId === selectedTeamId
    }
    return d.visibility === 'org'
  })

  // Folders visible in current space:
  // - personal: folders created by current user with personal visibility
  // - org: folders with org visibility
  // - team: folders linked to selected team
  // Plus any folder that actually contains docs in the current space (legacy support)
  const spaceFolderIds = [...new Set([
    ...folders
      .filter(f => {
        if (space === 'personal') return f.visibility === 'personal' && f.createdBy === currentUser.id
        if (space === 'team') return f.teamId === selectedTeamId
        return f.visibility === 'org'
      })
      .map(f => f.id),
    // Also show folders that contain docs in this space even if visibility mismatch (migration safety)
    ...spaceDocs.filter(d => d.folderId).map(d => d.folderId!),
  ])]
  // Keep uniqueFolderIds as alias for drag-and-drop color indexing
  const uniqueFolderIds = spaceFolderIds

  function getFolderName(id: string) {
    return folders.find(f => f.id === id)?.name ?? id
  }

  function getFolderColor(id: string) {
    const idx = uniqueFolderIds.indexOf(id)
    return FOLDER_COLORS[idx % FOLDER_COLORS.length]
  }

  const filtered = spaceDocs.filter(doc => {
    if (query && !doc.name.toLowerCase().includes(query.toLowerCase())) return false
    if (activeFolder && doc.folderId !== activeFolder) return false
    return true
  })

  function getUploader(id: string): User | undefined {
    return orgUsers.find(u => u.id === id)
  }

  const canUpload = space === 'personal' || space === 'team' || (space === 'org' && isAdmin)
  const uploadDisabledReason = space === 'org' && !isAdmin
    ? t('documents.uploadDisabledOrg')
    : space === 'team' && !selectedTeamId
      ? t('documents.uploadDisabledNoTeam')
      : null

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const currentUsed = docs.reduce((sum, d) => sum + d.size, 0)
    if (storageQuotaBytes > 0 && currentUsed + file.size > storageQuotaBytes) {
      setUploadError(t('documents.quotaExceeded'))
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
      space === 'team' ? (selectedTeamId ?? undefined) : undefined,
    )

    setUploading(false)
    if (error) { setUploadError(friendlyUploadError(error, t)); return }
    if (newDoc) setDocs(prev => [newDoc, ...prev])
  }

  async function handleDownload(doc: Document) {
    setDownloadingId(doc.id)
    setDownloadError(null)
    const { error } = await DocumentService.downloadDocument(doc.id, currentOrg.id, currentUser.id)
    setDownloadingId(null)
    if (error) setDownloadError(error)
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId)
    const { error } = await DocumentService.deleteDocument(docId)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (!error) setDocs(prev => prev.filter(d => d.id !== docId))
  }

  async function handleMoveToFolder(docId: string, folderId: string | null) {
    const { error } = await DocumentService.moveToFolder(docId, folderId)
    if (!error) setDocs(prev => prev.map(d => d.id === docId ? { ...d, folderId: folderId ?? undefined } : d))
  }

  async function handleDeleteFolder(folderId: string) {
    setDeletingFolderId(folderId)
    const { error } = await DocumentService.deleteFolder(folderId)
    setDeletingFolderId(null)
    if (!error) {
      setFolders(prev => prev.filter(f => f.id !== folderId))
      setDocs(prev => prev.map(d => d.folderId === folderId ? { ...d, folderId: undefined } : d))
      if (activeFolder === folderId) setActiveFolder(null)
    }
  }

  const selectedTeam = myTeams.find(t => t.id === selectedTeamId)

  return (
    <div className="flex-1 overflow-y-auto">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-ink">{t('documents.title')}</h2>
          <button
            onClick={() => { if (!uploadDisabledReason) fileInputRef.current?.click() }}
            disabled={uploading || !!uploadDisabledReason}
            title={uploadDisabledReason ?? undefined}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /><span className="hidden sm:inline">{t('documents.importing')}</span></>
              : <><Upload size={14} /><span className="hidden sm:inline">{t('documents.importBtn')}</span></>
            }
          </button>
        </div>

        {/* Space tabs */}
        <div className="flex gap-1.5 mb-3">
          {SPACE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setSpace(tab.value); setActiveFolder(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                space === tab.value ? 'bg-navy text-white' : 'bg-surface border border-border text-muted hover:bg-bg'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Team selector — only in team space */}
        {space === 'team' && myTeams.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5 scrollbar-none">
            {myTeams.map(team => (
              <button
                key={team.id}
                onClick={() => { setSelectedTeamId(team.id); setActiveFolder(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  selectedTeamId === team.id
                    ? 'text-white'
                    : 'bg-surface border border-border text-muted hover:bg-bg'
                }`}
                style={selectedTeamId === team.id ? { backgroundColor: team.color } : undefined}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                {team.name}
              </button>
            ))}
          </div>
        )}

        {space === 'team' && myTeams.length === 0 && (
          <p className="text-xs text-muted mb-3">{t('teams.noTeams')}</p>
        )}

        {/* Upload helper text */}
        {!uploadDisabledReason && (
          <p className="text-[11px] text-faint mb-2">{t('documents.acceptedFormats')} · {t('documents.maxSize')}</p>
        )}

        {uploadError && <p className="text-xs text-danger mb-2">{uploadError}</p>}
        {downloadError && <p className="text-xs text-danger mb-2">{downloadError}</p>}

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('documents.search')}
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent"
          />
        </div>
      </div>

      <div className="px-4 py-4 max-w-3xl">
        {/* Folders — shown in personal and org spaces when not inside a folder */}
        {space !== 'team' && !activeFolder && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">{t('documents.folders')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {uniqueFolderIds.map(fid => {
                const fileCount = docs.filter(d => d.folderId === fid).length
                const isDragTarget = dragOverFolder === fid
                return (
                  <button
                    key={fid}
                    onClick={() => setActiveFolder(fid)}
                    onDragOver={e => { e.preventDefault(); setDragOverFolder(fid) }}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={e => {
                      e.preventDefault()
                      setDragOverFolder(null)
                      const docId = e.dataTransfer.getData('docId')
                      if (docId) handleMoveToFolder(docId, fid)
                    }}
                    className={`group/folder flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      isDragTarget ? 'border-indigo bg-indigo-pale scale-[1.02] shadow-md' : 'border-border bg-surface hover:border-indigo/40 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getFolderColor(fid)}`}>
                      {isDragTarget ? <FolderOpen size={18} /> : <FolderIcon size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink truncate">{getFolderName(fid)}</div>
                      <div className="text-xs text-muted">{fileCount !== 1 ? t('documents.fileCountPlural', { count: String(fileCount) }) : t('documents.fileCount', { count: String(fileCount) })}</div>
                    </div>
                    {(isAdmin || folders.find(f => f.id === fid)?.createdBy === currentUser.id) && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleDeleteFolder(fid) }}
                        disabled={deletingFolderId === fid}
                        className="md:opacity-0 md:group-hover/folder:opacity-100 p-1 rounded-lg text-faint hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                        title={t('documents.deleteFolder')}
                      >
                        {deletingFolderId === fid ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    )}
                    {deletingFolderId !== fid && <ChevronRight size={14} className="text-faint shrink-0" />}
                  </button>
                )
              })}
              {/* Allow anyone to create personal folders; org/admin only for other spaces */}
              {(space === 'personal' || isAdmin) && (
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-indigo/40 hover:bg-bg transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center">
                    <Plus size={18} className="text-muted" />
                  </div>
                  <span className="text-sm text-muted">{t('documents.newFolder')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Team header */}
        {space === 'team' && selectedTeam && (
          <div className="flex items-center gap-2.5 mb-4 p-3 bg-surface rounded-xl border border-border">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: selectedTeam.color + '20' }}>
              <Users size={16} style={{ color: selectedTeam.color }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">{selectedTeam.name}</div>
              <div className="text-xs text-muted">{t('documents.docCount', { count: String(spaceDocs.length) })}</div>
            </div>
          </div>
        )}

        {/* Files */}
        <div>
          {/* Breadcrumb when inside a folder */}
          {activeFolder && (
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setActiveFolder(null)} className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors">
                <FolderOpen size={13} />
                <span>{t('documents.folders')}</span>
              </button>
              <ChevronRight size={12} className="text-faint" />
              <span className="text-xs font-semibold text-ink">{getFolderName(activeFolder)}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
              {activeFolder
                ? (filtered.length !== 1 ? t('documents.fileCountPlural', { count: String(filtered.length) }) : t('documents.fileCount', { count: String(filtered.length) }))
                : t('documents.files')}
            </h3>
            {activeFolder && filtered.length > 0 && (
              <span className="text-[10px] text-faint">{t('documents.dragHint')}</span>
            )}
          </div>

          {/* Drop zone when inside a folder — drag files here to move them in */}
          {activeFolder && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOverFolder(activeFolder) }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={e => {
                e.preventDefault()
                setDragOverFolder(null)
                const docId = e.dataTransfer.getData('docId')
                if (docId) handleMoveToFolder(docId, activeFolder)
              }}
              className={`mb-3 h-10 rounded-xl border-2 border-dashed flex items-center justify-center text-xs transition-all ${
                dragOverFolder === activeFolder ? 'border-indigo bg-indigo-pale text-indigo' : 'border-border text-faint'
              }`}
            >
              {t('documents.dropZoneHint')}
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(doc => {
              const uploader = getUploader(doc.ownerId)
              const isDownloading = downloadingId === doc.id
              const isDeleting = deletingId === doc.id
              const confirmingDelete = confirmDeleteId === doc.id
              const canDelete = isAdmin || doc.ownerId === currentUser.id
              return (
                <div
                  key={doc.id}
                  draggable
                  onDragStart={e => { e.dataTransfer.setData('docId', doc.id); e.dataTransfer.effectAllowed = 'move' }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 bg-surface rounded-xl border border-border hover:border-indigo/30 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
                >
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    disabled={isDownloading || isDeleting}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left disabled:opacity-60"
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
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {uploader && !confirmingDelete && (
                      <Avatar firstName={uploader.firstName} lastName={uploader.lastName} id={uploader.id} size="sm" src={uploader.avatarUrl} />
                    )}
                    {!confirmingDelete && (
                      <Download size={14} className="text-faint" onClick={() => handleDownload(doc)} />
                    )}
                    {canDelete && (
                      confirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={isDeleting}
                            className="text-[11px] font-semibold text-white bg-danger rounded-lg px-2 py-1 disabled:opacity-50"
                          >
                            {isDeleting ? '…' : t('common.delete')}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[11px] font-semibold text-muted bg-bg border border-border rounded-lg px-2 py-1"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          className="p-1.5 rounded-lg text-faint hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (space !== 'team' || selectedTeamId) && (
              <div className="py-16 text-center">
                <FileText size={32} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">
                  {space === 'team' && selectedTeam
                    ? t('documents.noResults', { query: selectedTeam.name })
                    : t('documents.noDocuments')
                  }
                </p>
                {canUpload && !uploadDisabledReason && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 text-sm text-indigo hover:underline">
                    {t('documents.importFirst')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewFolder && (
        <NewFolderModal
          defaultVisibility={space === 'org' ? 'org' : 'personal'}
          onClose={() => setShowNewFolder(false)}
          onCreated={folder => setFolders(prev => [...prev, folder])}
        />
      )}

      {previewDoc && (
        <DocumentPreviewModal
          docId={previewDoc.id}
          docName={previewDoc.name}
          docType={previewDoc.type}
          orgId={currentOrg.id}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => { handleDownload(previewDoc); setPreviewDoc(null) }}
        />
      )}
    </div>
  )
}
