import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Hash, User, Users, Lock, Paperclip, FolderInput, Check, Info, ArrowLeft, X, Bell, BellOff, Link2, Image, Crown, FileText, LogOut, Loader2, Calendar, BarChart2, Download, Trash2, AlertCircle, Reply, Copy, Forward } from 'lucide-react'
import { PollService } from '../../services/poll.service'
import type { Poll } from '../../services/poll.service'
import { useAuth } from '../../contexts/AuthContext'
import { MessageService } from '../../services/message.service'
import { UserService } from '../../services/user.service'
import { TeamService } from '../../services/team.service'
import { DocumentService } from '../../services/document.service'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { formatTime, formatFileSize } from '../../lib/utils'
import type { Channel, Message, User as AppUser, Team, Folder } from '../../lib/types'

/* ── Types ── */
type ConvType = 'direct' | 'group' | 'team'

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
  storagePath?: string
}

function fileIcon(type: string) {
  if (/^image\//i.test(type)) return <Image size={13} className="text-indigo" />
  return <Paperclip size={13} className="text-indigo" />
}

/* ── New group modal ── */
function NewGroupModal({ onClose, orgUsers, onCreated }: {
  onClose: () => void
  orgUsers: AppUser[]
  onCreated: () => void
}) {
  const { t } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  function toggle(id: string) { setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  async function handleCreate() {
    if (!name.trim() || selected.length === 0 || creating) return
    setCreating(true)
    await MessageService.createGroupConversation(currentOrg.id, [currentUser.id, ...selected], name.trim())
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy text-base">{t('messages.newGroup')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          {t('messages.privateGroup')}
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('messages.groupName')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Coordination projet" autoFocus
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('messages.participants')} ({selected.length})</label>
            <div className="max-h-44 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {orgUsers.filter(u => u.id !== currentUser.id && u.status === 'active' && u.role === 'member').map(u => (
                <button key={u.id} type="button" onClick={() => toggle(u.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${selected.includes(u.id) ? 'bg-indigo-pale' : 'hover:bg-bg'}`}>
                  <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ink truncate">{u.firstName} {u.lastName}</div>
                    <div className="text-[10px] text-muted">{u.jobTitle ?? t('common.collaborator')}</div>
                  </div>
                  {selected.includes(u.id) && <Check size={13} className="text-indigo shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || creating}
            className="flex-1 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {creating ? t('messages.creating') : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── New direct message modal ── */
function NewDirectModal({ onClose, contacts, onCreated }: {
  onClose: () => void
  contacts: AppUser[]
  onCreated: (channelId: string) => void
}) {
  const { t } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = contacts.filter(u =>
    !query || `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.toLowerCase())
  )

  async function select(userId: string) {
    if (creating) return
    setCreating(true)
    const result = await MessageService.createDirectConversation(currentOrg.id, currentUser.id, userId)
    if (result.id) onCreated(result.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy text-base">{t('messages.newDirect')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('messages.searchCollaborator')} autoFocus
          className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo mb-3" />
        <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">{t('messages.noCollaborator')}</p>
          ) : filtered.map(u => (
            <button key={u.id} type="button" onClick={() => select(u.id)} disabled={creating}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-bg transition-colors disabled:opacity-50">
              <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-ink truncate">{u.firstName} {u.lastName}</div>
                <div className="text-[10px] text-muted">{u.jobTitle ?? u.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Promote modal ── */
function PromoteModal({ file, conversationId, onClose }: { file: Attachment; conversationId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const { currentOrg, currentUser } = useAuth()
  const [folders, setFolders] = useState<(Folder | { id: null; name: string })[]>([])
  const [folderId, setFolderId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    DocumentService.listFolders(currentOrg.id).then(fs => {
      setFolders([{ id: null, name: t('messages.generalLibrary') } as { id: null; name: string }, ...fs])
    })
  }, [currentOrg.id])

  async function confirm() {
    if (!file.storagePath || saving) return
    setSaving(true)
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const actualSize = file.size > 0 ? file.size : await MessageService.getFileSize(file.storagePath)
    const { error: err } = await DocumentService.promoteFromPath(
      file.storagePath, currentOrg.id, currentUser.id,
      file.name, ext, actualSize, folderId ?? undefined, conversationId,
    )
    setSaving(false)
    if (err) { setError(err); return }
    setDone(true)
    setTimeout(onClose, 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-navy text-base">{t('messages.promoteTitle')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          {t('messages.promoteSubtitle')}
        </p>
        <div className="p-3 bg-bg rounded-xl border border-border mb-4 flex items-center gap-3">
          <Paperclip size={15} className="text-indigo shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink truncate">{file.name}</div>
            <div className="text-xs text-muted">{formatFileSize(file.size)}</div>
          </div>
        </div>
        <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wide">{t('messages.destination')}</label>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {folders.map(opt => (
            <button key={opt.id ?? 'root'} type="button" onClick={() => setFolderId(opt.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                folderId === opt.id ? 'border-indigo bg-indigo-pale' : 'border-border hover:border-indigo/30'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                folderId === opt.id ? 'border-indigo bg-indigo' : 'border-border'
              }`}>
                {folderId === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-sm font-semibold text-ink">{opt.name}</div>
            </button>
          ))}
          {folders.length === 0 && (
            <p className="text-xs text-muted text-center py-3">{t('messages.loadingFolders')}</p>
          )}
        </div>
        {error && <p className="text-xs text-danger mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button onClick={confirm} disabled={saving || !file.storagePath}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${done ? 'bg-success' : 'bg-indigo hover:opacity-90'}`}>
            {saving ? t('messages.saving') : done ? t('messages.added') : t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Small thumbnail for reply banner ── */
function ReplyPhotoThumb({ storagePath, conversationId, orgId }: {
  storagePath: string; conversationId: string; orgId: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let blobUrl: string | null = null
    MessageService.getDecryptedImageUrl(storagePath, conversationId, orgId).then(u => {
      blobUrl = u; setUrl(u)
    })
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [storagePath, conversationId, orgId])
  if (!url) return <div className="w-8 h-8 rounded bg-border shrink-0" />
  return <img src={url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
}

/* ── Forward modal ── */
function ForwardModal({ msg, channels, currentChannel, currentUser, currentOrg, onClose }: {
  msg: Message; channels: Channel[]; currentChannel: Channel
  currentUser: AppUser; currentOrg: { id: string }
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const targets = channels.filter(c =>
    c.id !== currentChannel.id &&
    (c.name?.toLowerCase().includes(search.toLowerCase()) || !search)
  )

  async function handleForward() {
    if (!targetId || sending) return
    setSending(true)
    try {
      if (msg.files?.length) {
        const fileName = msg.content.replace('📎 ', '') || msg.files[0].split('/').pop()!
        const blob = await MessageService.getDecryptedBlob(msg.files[0], currentChannel.id, currentOrg.id)
        if (blob) {
          const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' })
          const { path, error } = await MessageService.uploadAttachment(currentOrg.id, targetId, file)
          if (!error && path) {
            await MessageService.send(targetId, currentUser.id, `📎 ${fileName}`, currentOrg.id, [path])
          }
        }
      } else {
        await MessageService.send(targetId, currentUser.id, msg.content, currentOrg.id)
      }
      setDone(true)
      setTimeout(onClose, 1000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy text-base">{t('messages.forward')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <div className="px-3 py-2 rounded-xl bg-bg border border-border text-xs text-muted mb-4 truncate">
          {msg.files?.length ? `📎 ${msg.content.replace('📎 ', '')}` : msg.content.slice(0, 80)}
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('messages.forwardSearch')}
          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg text-ink placeholder:text-faint outline-none focus:border-indigo mb-3"
        />
        <div className="space-y-1 max-h-52 overflow-y-auto mb-4">
          {targets.map(c => (
            <button key={c.id} type="button" onClick={() => setTargetId(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${targetId === c.id ? 'bg-indigo-pale border border-indigo' : 'hover:bg-bg border border-transparent'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${targetId === c.id ? 'bg-indigo/20' : 'bg-border'}`}>
                {c.type === 'direct' ? <User size={14} className="text-muted" /> : <Users size={14} className="text-muted" />}
              </div>
              <span className="text-sm font-medium text-ink truncate">{c.name}</span>
              {targetId === c.id && <Check size={14} className="text-indigo ml-auto shrink-0" />}
            </button>
          ))}
          {targets.length === 0 && <p className="text-xs text-faint text-center py-4">{t('messages.forwardNoResults')}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button onClick={handleForward} disabled={!targetId || sending || done}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${done ? 'bg-success' : 'bg-indigo hover:opacity-90'}`}>
            {sending ? <Loader2 size={14} className="animate-spin mx-auto" /> : done ? t('messages.forwarded') : t('messages.forward')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── File preview modal ── */
function FilePreviewModal({ storagePath, fileName, fileSize, conversationId, orgId, onClose, onSaveToMyDocs }: {
  storagePath: string; fileName: string; fileSize: number
  conversationId: string; orgId: string
  onClose: () => void; onSaveToMyDocs: () => void
}) {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  async function handleDownload() {
    setDownloading(true)
    await MessageService.downloadAndDecrypt(storagePath, conversationId, orgId, fileName)
    setDownloading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy text-base">{t('messages.fileLabel')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <div className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-border mb-5">
          <div className="w-12 h-12 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
            <FileText size={22} className="text-indigo" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{fileName}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted">
              <span className="uppercase font-medium">{ext || '—'}</span>
              {fileSize > 0 && <><span>·</span><span>{formatFileSize(fileSize)}</span></>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={handleDownload} disabled={downloading}
            className="flex items-center justify-center gap-2 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {downloading ? t('messages.downloading') : t('common.download')}
          </button>
          <button onClick={() => { onSaveToMyDocs(); onClose() }}
            className="flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-semibold text-ink hover:bg-bg">
            <FolderInput size={15} className="text-indigo" />
            {t('messages.saveToMyDocs')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Inline image viewer ── */
function InlineImage({ storagePath, fileName, conversationId, orgId, isMe }: {
  storagePath: string; fileName: string; conversationId: string; orgId: string; isMe: boolean
}) {
  const { t } = useTranslation()
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  useEffect(() => {
    let url: string | null = null
    setLoadError(false)
    MessageService.getDecryptedImageUrl(storagePath, conversationId, orgId).then(u => {
      if (!u) { setLoadError(true); return }
      url = u
      setBlobUrl(u)
    }).catch(() => setLoadError(true))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [storagePath, conversationId, orgId])
  if (loadError) return (
    <div className="w-40 h-24 rounded-xl bg-bg border border-border flex flex-col items-center justify-center gap-1">
      <AlertCircle size={16} className="text-faint" />
      <span className="text-[10px] text-faint">{t('messages.imageUnavailable')}</span>
    </div>
  )
  if (!blobUrl) return (
    <div className="w-40 h-24 rounded-xl bg-bg border border-border flex items-center justify-center">
      <Loader2 size={16} className="text-faint animate-spin" />
    </div>
  )
  return (
    <>
      <button type="button" onClick={() => setLightbox(true)}
        className={`rounded-xl overflow-hidden border ${isMe ? 'border-indigo/20' : 'border-border'} hover:opacity-90 transition-opacity`}>
        <img src={blobUrl} alt={fileName} className="max-w-[200px] max-h-[160px] object-cover block" />
      </button>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <img src={blobUrl} alt={fileName} className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

/* ── Poll widget ── */
function PollWidget({ pollId, currentUserId, orgUsers: _orgUsers, cachedPoll, onPollLoaded, onVote }: {
  pollId: string; currentUserId: string; orgUsers: AppUser[]
  cachedPoll?: Poll; onPollLoaded: (p: Poll) => void; onVote: (pollId: string, optionId: string) => void
}) {
  const { t } = useTranslation()
  const [poll, setPoll] = useState<Poll | null>(cachedPoll ?? null)
  useEffect(() => {
    if (!cachedPoll) {
      PollService.getById(pollId).then(p => { if (p) { setPoll(p); onPollLoaded(p) } })
    } else {
      setPoll(cachedPoll)
    }
  }, [pollId, cachedPoll])
  if (!poll) return <div className="px-4 py-2.5 bg-surface border border-border rounded-2xl text-xs text-muted">{t('messages.loadingPoll')}</div>
  const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0)
  const myVote = poll.options.find(o => o.voters.includes(currentUserId))
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 w-64">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 size={14} className="text-indigo shrink-0" />
        <span className="text-xs font-semibold text-indigo uppercase tracking-wide">{t('messages.pollLabel')}</span>
      </div>
      <p className="text-sm font-semibold text-ink mb-3 leading-snug">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map(opt => {
          const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0
          const isMyChoice = opt.voters.includes(currentUserId)
          return (
            <button key={opt.id} type="button"
              onClick={() => !myVote && onVote(pollId, opt.id)}
              disabled={!!myVote}
              className={`w-full text-left relative overflow-hidden rounded-lg border transition-colors ${isMyChoice ? 'border-indigo bg-indigo-pale' : myVote ? 'border-border bg-bg' : 'border-border hover:border-indigo/40 hover:bg-bg'}`}>
              <div className="absolute inset-0 left-0 bg-indigo/10 transition-all" style={{ width: myVote ? `${pct}%` : '0%' }} />
              <div className="relative flex items-center justify-between px-3 py-2">
                <span className={`text-xs font-medium ${isMyChoice ? 'text-indigo' : 'text-ink'}`}>{opt.text}</span>
                {myVote && <span className="text-[10px] text-muted">{pct}%</span>}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-faint mt-2">{totalVotes} vote{totalVotes > 1 ? 's' : ''}{myVote ? ` · ${t('messages.alreadyVoted')}` : ''}</p>
    </div>
  )
}

/* ── Poll creation form ── */
function PollForm({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (question: string, options: string[], multipleChoice: boolean) => void
}) {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multiple, setMultiple] = useState(false)
  function addOption() { if (options.length < 6) setOptions(p => [...p, '']) }
  function setOption(i: number, v: string) { setOptions(p => p.map((o, idx) => idx === i ? v : o)) }
  const canSubmit = question.trim() && options.filter(o => o.trim()).length >= 2
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy text-base">{t('messages.pollCreate')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('messages.pollQuestion')}</label>
            <input value={question} onChange={e => setQuestion(e.target.value)} autoFocus
              placeholder={`${t('messages.pollQuestion')}…`}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('messages.pollOptions')}</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <input key={i} value={opt} onChange={e => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
              ))}
              {options.length < 6 && (
                <button onClick={addOption} className="text-xs text-indigo font-medium hover:underline">{t('messages.addOption')}</button>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={multiple} onChange={e => setMultiple(e.target.checked)} className="rounded" />
            <span className="text-xs text-ink">{t('messages.multipleChoice')}</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button disabled={!canSubmit} onClick={() => onSubmit(question.trim(), options.filter(o => o.trim()), multiple)}
            className="flex-1 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">{t('common.create')}</button>
        </div>
      </div>
    </div>
  )
}

/* ── Quick meeting form ── */
function QuickMeetingForm({ orgUsers, currentUser, currentOrg: _currentOrg, onClose, onCreated, prefillParticipants }: {
  orgUsers: AppUser[]; currentUser: AppUser; currentOrg: { id: string }
  onClose: () => void
  onCreated: (title: string, startAt: string, endAt: string, participants: string[]) => void
  prefillParticipants?: string[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [timeStart, setTimeStart] = useState('09:00')
  const [timeEnd, setTimeEnd] = useState('10:00')
  const [selected, setSelected] = useState<string[]>(prefillParticipants ?? [])
  const hasPrefill = (prefillParticipants?.length ?? 0) > 0
  const members = orgUsers.filter(u => u.id !== currentUser.id && u.status === 'active')
  function toggle(id: string) { setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }
  const canSubmit = title.trim() && date && timeStart && timeEnd
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy text-base">{t('messages.scheduleMeeting')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg"><X size={15} /></button>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder={t('agenda.title')}
            className="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
          <div className="grid grid-cols-3 gap-2">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="col-span-1 px-2 py-2.5 bg-bg border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo" />
            <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)}
              className="px-2 py-2.5 bg-bg border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo" />
            <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)}
              className="px-2 py-2.5 bg-bg border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo" />
          </div>
          {hasPrefill ? (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('messages.participants')} ({selected.length})</label>
              <div className="flex flex-wrap gap-1.5">
                {selected.map(id => {
                  const u = members.find(m => m.id === id)
                  if (!u) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 bg-indigo-pale rounded-full text-xs font-medium text-indigo">
                      <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
                      {u.firstName}
                    </span>
                  )
                })}
              </div>
            </div>
          ) : members.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">{t('messages.participants')}</label>
              <div className="max-h-32 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                {members.map(u => (
                  <button key={u.id} type="button" onClick={() => toggle(u.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${selected.includes(u.id) ? 'bg-indigo-pale' : 'hover:bg-bg'}`}>
                    <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
                    <span className="flex-1 font-medium text-ink truncate">{u.firstName} {u.lastName}</span>
                    {selected.includes(u.id) && <Check size={12} className="text-indigo shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">{t('common.cancel')}</button>
          <button disabled={!canSubmit} onClick={() => {
            const startAt = new Date(`${date}T${timeStart}:00`).toISOString()
            const endAt = new Date(`${date}T${timeEnd}:00`).toISOString()
            onCreated(title.trim(), startAt, endAt, selected)
            onClose()
          }} className="flex-1 py-2.5 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">{t('common.create')}</button>
        </div>
        <button
          onClick={() => {
            const ids = prefillParticipants?.length ? prefillParticipants : selected
            const params = new URLSearchParams()
            if (ids.length) params.set('participants', ids.join(','))
            if (title.trim()) params.set('title', title.trim())
            onClose()
            navigate(`/app/agenda?${params.toString()}`)
          }}
          className="w-full mt-2 text-xs text-indigo hover:underline text-center"
        >
          {t('messages.openAgenda')}
        </button>
      </div>
    </div>
  )
}

/* ── Conversation info panel ── */
type LibrarySection = 'files' | 'links'

function InfoPanel({ channel, orgUsers, teams, attachments, onClose, onNavigateToDocs, onLeave }: {
  channel: Channel
  orgUsers: AppUser[]
  teams: Team[]
  attachments: Attachment[]
  onClose: () => void
  onNavigateToDocs: () => void
  onLeave: () => void
}) {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const type = channel.type as ConvType
  const MUTED_KEY = `muted_conv_${channel.id}`
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTED_KEY) === '1')
  const [libraryOpen, setLibraryOpen] = useState<LibrarySection | null>(null)

  const otherMemberId = channel.members.find(id => id !== currentUser.id) ?? ''
  const otherUser = orgUsers.find(u => u.id === otherMemberId)
  const allMembers = channel.members.map(id => orgUsers.find(u => u.id === id)).filter(Boolean)

  const team = type === 'team' && channel.teamId ? teams.find(t => t.id === channel.teamId) : null
  const teamResponsable = team ? orgUsers.find(u => u.id === team.responsableId) : null
  const teamMembers = team
    ? team.members.map(id => orgUsers.find(u => u.id === id)).filter(Boolean)
    : allMembers

  function SectionHeader({ label }: { label: string }) {
    return <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</h3>
  }

  const libraryTitles: Record<LibrarySection, string> = {
    files: t('messages.sharedFiles'),
    links: t('messages.sharedLinks'),
  }

  if (libraryOpen) {
    return (
      <div className="flex flex-col h-full bg-bg">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
          <button onClick={() => setLibraryOpen(null)} className="p-1.5 rounded-lg text-muted hover:text-ink">
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-ink">{libraryTitles[libraryOpen]}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {libraryOpen === 'files' && (
            attachments.length === 0 ? (
              <div className="py-16 text-center">
                <Paperclip size={28} className="text-faint mx-auto mb-3" />
                <p className="text-sm text-muted">{t('messages.noFiles')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                    <Paperclip size={14} className="text-indigo shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{att.name}</div>
                      <div className="text-xs text-muted">{formatFileSize(att.size)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {libraryOpen === 'links' && (
            <div className="py-16 text-center">
              <Link2 size={28} className="text-faint mx-auto mb-3" />
              <p className="text-sm text-muted">{t('messages.noLinks')}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-ink">
          {type === 'direct' ? t('messages.profile') : type === 'group' ? t('messages.groupInfo') : t('messages.teamInfo')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Identity */}
        <div className="flex flex-col items-center py-8 px-4 border-b border-border bg-surface">
          {type === 'direct' && otherUser ? (
            <>
              <Avatar firstName={otherUser.firstName} lastName={otherUser.lastName} id={otherUser.id} size="xl" src={otherUser.avatarUrl} />
              <h2 className="font-bold text-ink text-base mt-3">{otherUser.firstName} {otherUser.lastName}</h2>
              <p className="text-sm text-muted">{otherUser.role === 'admin' ? t('common.administrator') : t('common.collaborator')}</p>
              <span className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                otherUser.status === 'active' ? 'bg-success/10 text-success' : 'bg-amber/10 text-amber'
              }`}>
                {otherUser.status === 'active' ? t('messages.statusActive') : t('messages.statusSuspended')}
              </span>
            </>
          ) : type === 'group' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-indigo-pale flex items-center justify-center mb-3">
                <Lock size={24} className="text-indigo" />
              </div>
              <h2 className="font-bold text-ink text-base">{channel.name}</h2>
              <p className="text-sm text-muted">{t('messages.groupOf', { count: allMembers.length })}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-navy/10 flex items-center justify-center mb-3">
                <Hash size={24} className="text-navy" />
              </div>
              <h2 className="font-bold text-ink text-base">{channel.name}</h2>
              <p className="text-sm text-muted">{t('messages.teamSpace', { count: teamMembers.length })}</p>
            </>
          )}
        </div>

        {/* Responsable — team only */}
        {type === 'team' && teamResponsable && (
          <div className="px-4 py-4 border-b border-border">
            <SectionHeader label={t('messages.responsible')} />
            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border mt-3">
              <Avatar firstName={teamResponsable.firstName} lastName={teamResponsable.lastName} id={teamResponsable.id} size="sm" src={teamResponsable.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{teamResponsable.firstName} {teamResponsable.lastName}</div>
                <div className="text-xs text-muted">{teamResponsable.role}</div>
              </div>
              <Crown size={14} className="text-amber shrink-0" />
            </div>
          </div>
        )}

        {/* Members */}
        {(type === 'group' || type === 'team') && (
          <div className="px-4 py-4 border-b border-border">
            <SectionHeader label={`${t('messages.members')} · ${(type === 'team' ? teamMembers : allMembers).length}`} />
            <div className="space-y-2 mt-3">
              {(type === 'team' ? teamMembers : allMembers).map(m => m && (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <Avatar firstName={m.firstName} lastName={m.lastName} id={m.id} size="sm" src={m.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{m.firstName} {m.lastName}</div>
                    <div className="text-xs text-muted">{m.role}</div>
                  </div>
                  {m.id === currentUser.id && <span className="text-[10px] font-semibold text-indigo bg-indigo-pale px-1.5 py-0.5 rounded-full">{t('common.you')}</span>}
                  {type === 'team' && team?.responsableId === m.id && m.id !== currentUser.id && <Crown size={12} className="text-amber shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared files */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader label={t('messages.sharedFiles')} />
            {attachments.length > 0 && (
              <button onClick={() => setLibraryOpen('files')} className="text-xs text-indigo font-medium hover:underline">
                {t('messages.seeAll')} ({attachments.length})
              </button>
            )}
          </div>
          {attachments.length === 0 ? (
            <button onClick={() => setLibraryOpen('files')}
              className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-indigo/30 transition-colors text-left">
              <Paperclip size={14} className="text-faint shrink-0" />
              <span className="text-xs text-muted">{t('messages.seeAllFiles')}</span>
            </button>
          ) : (
            <div className="space-y-2">
              {attachments.slice(0, 2).map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <Paperclip size={14} className="text-indigo shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{att.name}</div>
                    <div className="text-xs text-muted">{formatFileSize(att.size)}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => setLibraryOpen('files')}
                className="w-full py-2.5 text-xs text-indigo font-medium border border-indigo/20 rounded-xl hover:bg-indigo-pale transition-colors">
                {t('messages.seeAllFiles')}
              </button>
            </div>
          )}
        </div>

        {/* Team documents */}
        {type === 'team' && (
          <div className="px-4 py-4 border-b border-border">
            <div className="mb-3"><SectionHeader label={t('messages.teamDocuments')} /></div>
            <button onClick={onNavigateToDocs} className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-indigo/40 transition-colors text-left">
              <FileText size={14} className="text-indigo shrink-0" />
              <span className="text-sm text-indigo font-medium">{t('messages.seeSharedLinks')}</span>
            </button>
          </div>
        )}


        {/* Media — group & team */}
        {(type === 'group' || type === 'team') && (
          <div className="px-4 py-4 border-b border-border">
            <div className="mb-3"><SectionHeader label={t('messages.media')} /></div>
            <div className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-border text-faint">
              <Image size={14} className="shrink-0" />
              <span className="text-xs">{t('messages.mediaHint')}</span>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="px-4 py-4 space-y-2">
          <div className="mb-3"><SectionHeader label={t('messages.options')} /></div>
          <div className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-border">
            <div className="flex items-center gap-3">
              {muted ? <BellOff size={16} className="text-muted" /> : <Bell size={16} className="text-muted" />}
              <span className="text-sm text-ink">{t('messages.notifications')}</span>
            </div>
            <button type="button" onClick={() => {
              const next = !muted
              setMuted(next)
              if (next) localStorage.setItem(MUTED_KEY, '1')
              else localStorage.removeItem(MUTED_KEY)
            }}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${muted ? 'bg-border' : 'bg-success'}`}>
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${muted ? 'translate-x-0.5' : 'translate-x-4'}`} />
            </button>
          </div>
          {type === 'group' && (
            <button onClick={() => { if (window.confirm(t('messages.leaveGroupConfirm'))) onLeave() }}
              className="w-full flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border text-left hover:border-danger/40 transition-colors">
              <LogOut size={16} className="text-danger shrink-0" />
              <span className="text-sm text-danger">{t('messages.leaveGroup')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Conversation list ── */
function ConvList({ channels, onSelect, selected, onNewDirect, onNewGroup, orgUsers, currentUserId }: {
  channels: Channel[]
  onSelect: (id: string) => void
  selected: string | null
  onNewDirect: () => void
  onNewGroup: () => void
  orgUsers: AppUser[]
  currentUserId: string
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [showNewMenu, setShowNewMenu] = useState(false)

  const byType: Record<ConvType, Channel[]> = { direct: [], group: [], team: [] }
  channels.forEach(c => {
    const filtered = !query || c.name.toLowerCase().includes(query.toLowerCase())
    const bucket = byType[c.type as ConvType]
    if (filtered && bucket) bucket.push(c)
  })

  const sectionLabel: Record<ConvType, string> = {
    direct: t('messages.directs'),
    group: t('messages.groups'),
    team: t('messages.teams'),
  }
  const sections: { type: ConvType; items: Channel[] }[] = [
    { type: 'direct' as ConvType, items: byType.direct },
    { type: 'group' as ConvType, items: byType.group },
    { type: 'team' as ConvType, items: byType.team },
  ].filter(s => s.items.length > 0)

  function getAvatarParts(ch: Channel) {
    const parts = ch.name.split(' ')
    return { firstName: parts[0] ?? '', lastName: parts[1] ?? '' }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-ink">{t('messages.title')}</h2>
          <div className="relative">
            <button onClick={() => setShowNewMenu(m => !m)} title={t('messages.newConversation')}
              className="w-8 h-8 rounded-full bg-indigo-pale flex items-center justify-center text-indigo hover:bg-indigo hover:text-white transition-colors">
              <Plus size={16} />
            </button>
            {showNewMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNewMenu(false)} />
                <div className="absolute right-0 top-9 z-50 bg-surface border border-border rounded-xl shadow-xl overflow-hidden w-48">
                  <button onClick={() => { setShowNewMenu(false); onNewDirect() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink hover:bg-bg">
                    <User size={14} className="text-indigo shrink-0" />
                    {t('messages.newDirectMsg')}
                  </button>
                  <button onClick={() => { setShowNewMenu(false); onNewGroup() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink hover:bg-bg border-t border-border">
                    <Users size={14} className="text-indigo shrink-0" />
                    {t('messages.newGroup')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('messages.searchConv')}
            className="w-full pl-9 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sections.map(({ type, items }) => (
          <div key={type} className="mb-2">
            <p className="text-[10px] font-semibold text-faint uppercase tracking-wider px-3 py-2">{sectionLabel[type]}</p>
            {items.map(ch => {
              const isTeam = type === 'team'
              const isGroup = type === 'group'
              const { firstName, lastName } = getAvatarParts(ch)
              return (
                <button key={ch.id} onClick={() => onSelect(ch.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-colors ${selected === ch.id ? 'bg-indigo-pale' : 'hover:bg-bg'}`}>
                  {isTeam ? (
                    <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center shrink-0"><Hash size={14} className="text-indigo-light" /></div>
                  ) : isGroup ? (
                    <div className="w-9 h-9 rounded-xl bg-indigo-pale flex items-center justify-center shrink-0"><Lock size={14} className="text-indigo" /></div>
                  ) : (
                    <Avatar firstName={firstName} lastName={lastName} id={ch.members.find(id => id !== currentUserId) ?? ch.id} src={orgUsers.find(u => u.id === ch.members.find(id => id !== currentUserId))?.avatarUrl} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-semibold truncate ${selected === ch.id ? 'text-indigo' : 'text-ink'}`}>{ch.name}</span>
                      {ch.lastMessage && <span className="text-[10px] text-faint shrink-0 ml-1">{formatTime(ch.lastMessage.createdAt)}</span>}
                    </div>
                    {ch.lastMessage && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted truncate">{ch.lastMessage.content}</p>
                        {(ch.unreadCount ?? 0) > 0 && <Badge count={ch.unreadCount!} />}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
        {sections.length === 0 && <p className="text-xs text-faint text-center py-8">{t('messages.noResults')}</p>}
      </div>
    </div>
  )
}

/* ── Conversation view ── */
function ConvView({ channel, channels, orgUsers, teams, onBack, onLeaveChannel }: {
  channel: Channel
  channels: Channel[]
  orgUsers: AppUser[]
  teams: Team[]
  onBack: () => void
  onLeaveChannel: (channelId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const navigate = useNavigate()
  const type = channel.type as ConvType
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [promoteFile, setPromoteFile] = useState<Attachment | null>(null)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>([])
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [showPollForm, setShowPollForm] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [polls, setPolls] = useState<Record<string, Poll>>({})
  const [readStatus, setReadStatus] = useState<Record<string, string>>({})
  const [reactions, setReactions] = useState<Record<string, { emoji: string; userId: string }[]>>({})
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null)
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<{ storagePath: string; fileName: string; fileSize: number } | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  // Load messages on channel change + mark as read + load read status
  useEffect(() => {
    setMessages([])
    setLocalAttachments([])
    setReadStatus({})
    setReactions({})
    setHasMore(false)
    setReplyingTo(null)
    MessageService.getMessages(channel.id, currentOrg.id).then(({ messages, hasMore }) => {
      setMessages(messages)
      setHasMore(hasMore)
    })
    MessageService.markConversationRead(channel.id, currentUser.id).then(() => {
      MessageService.getReadStatus(channel.id).then(setReadStatus)
    })
    MessageService.getReactions(channel.id).then(setReactions)
  }, [channel.id])

  async function loadOlderMessages() {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    const oldest = messages[0].createdAt
    const { messages: older, hasMore: moreExist } = await MessageService.getMessages(channel.id, currentOrg.id, 100, oldest)
    setMessages(prev => [...older, ...prev])
    setHasMore(moreExist)
    setLoadingMore(false)
  }

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = MessageService.subscribe(channel.id, currentOrg.id, msg => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
    })
    return unsubscribe
  }, [channel.id])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getUser = useCallback((id: string) => orgUsers.find(u => u.id === id), [orgUsers])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    setUploading(true)
    setUploadError(null)
    const { path, url, error } = await MessageService.uploadAttachment(currentOrg.id, channel.id, f)
    setUploading(false)
    if (error || !path) { setUploadError(error ?? t('messages.uploadFileError')); return }
    const att: Attachment = { id: `a${Date.now()}`, name: f.name, size: f.size, type: f.type || 'application/octet-stream', url: url ?? undefined, storagePath: path }
    setLocalAttachments(prev => [...prev, att])
    const { error: sendErr } = await MessageService.send(channel.id, currentUser.id, `📎 ${f.name}`, currentOrg.id, [path], channel.type)
    if (sendErr) setUploadError(sendErr)
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    setUploadError(null)
    setText('')
    const replyId = replyingTo?.id
    const savedReplyingTo = replyingTo
    setReplyingTo(null)
    const { error: sendErr } = await MessageService.send(channel.id, currentUser.id, trimmed, currentOrg.id, undefined, channel.type, replyId)
    if (sendErr) { setText(trimmed); setReplyingTo(savedReplyingTo); setUploadError(sendErr) }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    setShowPlusMenu(false)
    setUploading(true)
    setUploadError(null)
    const { path, url, error } = await MessageService.uploadAttachment(currentOrg.id, channel.id, f)
    setUploading(false)
    if (error || !path) { setUploadError(error ?? t('messages.uploadPhotoError')); return }
    const att: Attachment = { id: `a${Date.now()}`, name: f.name, size: f.size, type: f.type || 'image/jpeg', url: url ?? undefined, storagePath: path }
    setLocalAttachments(prev => [...prev, att])
    const { error: sendErr } = await MessageService.send(channel.id, currentUser.id, `📎 ${f.name}`, currentOrg.id, [path], channel.type)
    if (sendErr) setUploadError(sendErr)
  }

  async function handlePollCreate(question: string, options: string[], multipleChoice: boolean) {
    setShowPollForm(false)
    const poll = await PollService.create({
      conversationId: channel.id,
      organizationId: currentOrg.id,
      creatorId: currentUser.id,
      question,
      options,
      multipleChoice,
    })
    if (poll) {
      setPolls(prev => ({ ...prev, [poll.id]: poll }))
      const { error: sendErr } = await MessageService.send(channel.id, currentUser.id, `__poll__:${poll.id}`, currentOrg.id, undefined, channel.type)
      if (sendErr) setUploadError(sendErr)
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    const updated = await PollService.vote(pollId, optionId, currentUser.id)
    if (updated) setPolls(prev => ({ ...prev, [pollId]: updated }))
  }

  async function handleLeave() {
    await MessageService.leaveConversation(channel.id, currentUser.id)
    onLeaveChannel(channel.id)
  }

  async function handleDeleteMessage(messageId: string) {
    setDeletingMsgId(messageId)
    await MessageService.deleteMessage(messageId, currentUser.id)
    setMessages(prev => prev.filter(m => m.id !== messageId))
    setDeletingMsgId(null)
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const existing = reactions[messageId] ?? []
    const hasReacted = existing.some(r => r.userId === currentUser.id && r.emoji === emoji)
    if (hasReacted) {
      await MessageService.removeReaction(messageId, currentUser.id, emoji)
      setReactions(prev => ({
        ...prev,
        [messageId]: (prev[messageId] ?? []).filter(r => !(r.userId === currentUser.id && r.emoji === emoji)),
      }))
    } else {
      await MessageService.addReaction(messageId, currentUser.id, emoji)
      setReactions(prev => ({
        ...prev,
        [messageId]: [...(prev[messageId] ?? []), { emoji, userId: currentUser.id }],
      }))
    }
    setEmojiPickerMsgId(null)
  }

  if (showInfo) {
    return (
      <InfoPanel
        channel={channel}
        orgUsers={orgUsers}
        teams={teams}
        attachments={localAttachments}
        onClose={() => setShowInfo(false)}
        onNavigateToDocs={() => navigate('/app/documents')}
        onLeave={handleLeave}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-lg text-muted hover:text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {type === 'team' && <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center shrink-0"><Hash size={14} className="text-indigo-light" /></div>}
        {type === 'group' && <div className="w-8 h-8 rounded-xl bg-indigo-pale flex items-center justify-center shrink-0"><Lock size={14} className="text-indigo" /></div>}
        {type === 'direct' && (() => {
          const otherId = channel.members.find(id => id !== currentUser.id) ?? channel.id
          const other = orgUsers.find(u => u.id === otherId)
          const p = channel.name.split(' ')
          return <Avatar firstName={p[0]} lastName={p[1] ?? ''} id={otherId} size="sm" src={other?.avatarUrl} />
        })()}

        <button className="flex-1 min-w-0 text-left" onClick={() => setShowInfo(true)}>
          <div className="font-semibold text-ink text-sm hover:text-indigo transition-colors">{channel.name}</div>
          <div className="text-[10px] text-muted">
            {type === 'direct' && t('messages.privateConv')}
            {type === 'group' && t('messages.groupOf', { count: channel.members.length })}
            {type === 'team' && t('messages.teamSpace', { count: channel.members.length })}
          </div>
        </button>

        <div className="flex items-center gap-1">
          {localAttachments.length > 0 && (
            <button onClick={() => setShowAttachments(!showAttachments)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${showAttachments ? 'bg-indigo text-white' : 'bg-bg border border-border text-muted hover:text-ink'}`}>
              <Paperclip size={13} />{localAttachments.length}
            </button>
          )}
          <button onClick={() => setShowInfo(true)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors">
            <Info size={17} />
          </button>
        </div>
      </div>

      {/* Attachments panel */}
      {showAttachments && (
        <div className="bg-bg border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">{t('messages.attachments')}</p>
            <p className="text-[10px] text-faint">{t('messages.filesPrivate')}</p>
          </div>
          <div className="flex flex-col gap-2">
            {localAttachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-2.5 bg-surface rounded-xl border border-border">
                <div className="w-7 h-7 rounded-lg bg-indigo-pale flex items-center justify-center shrink-0">
                  <Paperclip size={13} className="text-indigo" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ink truncate">{att.name}</div>
                  <div className="text-[10px] text-muted">{formatFileSize(att.size)}</div>
                </div>
                <button onClick={() => setPromoteFile(att)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo border border-indigo/20 rounded-lg hover:bg-indigo-pale transition-colors shrink-0">
                  <FolderInput size={11} /> {t('messages.addToDocuments')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 space-y-0">
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadOlderMessages}
              disabled={loadingMore}
              className="text-xs text-indigo hover:underline disabled:opacity-50 flex items-center gap-1.5 py-1"
            >
              {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
              {loadingMore ? t('common.loading') : t('messages.loadPrevious')}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-indigo-pale flex items-center justify-center mb-3">
              {type === 'team' ? <Hash size={22} className="text-indigo" /> : type === 'group' ? <Lock size={22} className="text-indigo" /> : <User size={22} className="text-indigo" />}
            </div>
            <p className="text-sm font-semibold text-ink mb-1">{t('messages.beginConversation')}</p>
            <p className="text-xs text-muted">{t('messages.sendFirst')}</p>
          </div>
        )}
        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1]
          const nextMsg = messages[index + 1]
          const GROUP_GAP_MS = 5 * 60 * 1000

          // Date separator between different days
          const showDateSep = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString()

          // Grouping: same sender, within 5 minutes, same day
          const isFirstInGroup = !prevMsg
            || prevMsg.senderId !== msg.senderId
            || new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > GROUP_GAP_MS
            || showDateSep

          const isLastInGroup = !nextMsg
            || nextMsg.senderId !== msg.senderId
            || new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > GROUP_GAP_MS
            || new Date(nextMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString()

          const user = getUser(msg.senderId)
          const isMe = msg.senderId === currentUser.id
          const isFileMsg = msg.files && msg.files.length > 0
          const isPollMsg = msg.content.startsWith('__poll__:')
          const isMeetingMsg = msg.content.startsWith('__meeting__:')
          const pollId = isPollMsg ? msg.content.replace('__poll__:', '') : null
          const meetingData = isMeetingMsg ? (() => { try { return JSON.parse(msg.content.slice('__meeting__:'.length)) as { title: string; startAt: string; endAt: string } } catch { return null } })() : null
          const storagePath = isFileMsg ? msg.files![0] : null
          const fileName = msg.content.replace('📎 ', '') || storagePath?.split('/').pop() || t('messages.unnamedFile')
          const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
          const isImageFile = isFileMsg && /^(png|jpg|jpeg|gif|webp|svg)$/.test(ext)
          const msgReactions = reactions[msg.id] ?? []
          const reactionGroups = msgReactions.reduce<Record<string, { emoji: string; count: number; isMine: boolean }>>((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, isMine: false }
            acc[r.emoji].count++
            if (r.userId === currentUser.id) acc[r.emoji].isMine = true
            return acc
          }, {})
          const isSeen = isMe && Object.entries(readStatus).some(
            ([uid, ts]) => uid !== currentUser.id && new Date(ts) >= new Date(msg.createdAt)
          )
          const isLastMyMsg = isMe && messages.filter(m => m.senderId === currentUser.id).at(-1)?.id === msg.id

          // Bubble radius adapts to position in group
          const bubbleRadius = isMe
            ? `rounded-2xl ${isFirstInGroup ? 'rounded-tr-md' : ''} ${isLastInGroup ? 'rounded-br-md' : 'rounded-r-md'}`
            : `rounded-2xl ${isFirstInGroup ? 'rounded-tl-md' : ''} ${isLastInGroup ? 'rounded-bl-md' : 'rounded-l-md'}`

          // Outer margin: tight within group, more space between groups
          const rowMargin = isFirstInGroup ? 'mt-3' : 'mt-0.5'

          // Quoted reply
          const repliedMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null
          const replyAuthorName = repliedMsg
            ? repliedMsg.senderId === currentUser.id
              ? t('common.you')
              : (() => { const u = getUser(repliedMsg.senderId); return u ? `${u.firstName} ${u.lastName}` : '—' })()
            : ''
          const replyPreview = repliedMsg
            ? repliedMsg.content.startsWith('__poll__') ? `📊 ${t('messages.pollLabel')}`
              : repliedMsg.content.startsWith('__meeting__') ? `📅 ${t('messages.meetingLabel')}`
              : repliedMsg.content.startsWith('📎') ? repliedMsg.content
              : repliedMsg.content.slice(0, 80)
            : ''
          const scrollToReply = () => {
            if (!repliedMsg) return
            const el = document.getElementById(`msg-${repliedMsg.id}`)
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el?.classList.add('highlight-flash')
            setTimeout(() => el?.classList.remove('highlight-flash'), 1200)
          }

          return (
            <div key={msg.id} id={`msg-${msg.id}`}>
              {/* Date separator */}
              {showDateSep && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-semibold text-faint uppercase tracking-wide whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              <div className={`group flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''} ${rowMargin}`}>
                {/* Avatar — only show for last message in a group, or a spacer otherwise */}
                {!isMe ? (
                  isLastInGroup && user
                    ? <div className="shrink-0 self-end"><Avatar firstName={user.firstName} lastName={user.lastName} id={user.id} size="sm" src={user.avatarUrl} /></div>
                    : <div className="w-8 shrink-0" />
                ) : null}

              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender name — only first in group, others only */}
                {!isMe && isFirstInGroup && user && (
                  <span className="text-[11px] font-semibold text-muted ml-1 mb-0.5">{user.firstName} {user.lastName}</span>
                )}
                {repliedMsg && !isPollMsg && (isFileMsg || isMeetingMsg) && (
                  <button type="button" onClick={scrollToReply}
                    className={`block w-full text-left mb-1 px-2 py-1.5 rounded-lg border-l-2 border-indigo bg-indigo/5`}>
                    <div className="text-[10px] font-semibold mb-0.5 text-indigo truncate">{replyAuthorName}</div>
                    <div className="text-[11px] text-muted truncate">{replyPreview}</div>
                  </button>
                )}
                {isPollMsg && pollId ? (
                  <PollWidget
                    pollId={pollId}
                    currentUserId={currentUser.id}
                    orgUsers={orgUsers}
                    cachedPoll={polls[pollId]}
                    onPollLoaded={p => setPolls(prev => ({ ...prev, [p.id]: p }))}
                    onVote={handleVote}
                  />
                ) : isFileMsg && isImageFile ? (
                  <InlineImage
                    storagePath={storagePath!}
                    fileName={fileName}
                    conversationId={channel.id}
                    orgId={currentOrg.id}
                    isMe={isMe}
                  />
                ) : isMeetingMsg && meetingData ? (
                  <button
                    type="button"
                    onClick={() => navigate('/app/agenda')}
                    className={`flex items-center gap-3 px-3 py-2.5 border text-sm ${bubbleRadius} ${isMe ? 'bg-indigo/10 border-indigo/20' : 'bg-surface border-border'} hover:opacity-80 transition-opacity`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                      <Calendar size={15} className="text-amber-500" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">{meetingData.title}</div>
                      <div className="text-[10px] text-muted mt-0.5">
                        {new Date(meetingData.startAt).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-indigo mt-0.5">{t('messages.seeInAgenda')}</div>
                    </div>
                  </button>
                ) : isFileMsg ? (
                  <button
                    type="button"
                    onClick={() => {
                      const knownSize = localAttachments.find(a => a.storagePath === storagePath)?.size ?? 0
                      setFilePreview({ storagePath: storagePath!, fileName, fileSize: knownSize })
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 border text-sm text-left ${bubbleRadius} ${isMe ? 'bg-indigo/10 border-indigo/20 text-indigo' : 'bg-surface border-border text-ink'} hover:opacity-80 transition-opacity`}
                  >
                    {fileIcon(storagePath!)}
                    <span className="truncate max-w-[130px] font-medium">{fileName}</span>
                    <Download size={13} className="ml-1 shrink-0 opacity-60" />
                  </button>
                ) : (
                  <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${bubbleRadius} ${isMe ? 'bg-indigo text-white' : 'bg-surface border border-border text-ink'}`}>
                    {repliedMsg && (
                      <button type="button" onClick={scrollToReply}
                        className={`block w-full text-left mb-2 px-2 py-1.5 rounded-lg border-l-2 ${isMe ? 'border-white/50 bg-white/15 text-white/75' : 'border-indigo bg-indigo/8 text-muted'}`}>
                        <div className="text-[10px] font-semibold mb-0.5 truncate">{replyAuthorName}</div>
                        <div className="text-[11px] truncate opacity-80">{replyPreview}</div>
                      </button>
                    )}
                    {msg.content}
                  </div>
                )}
                {/* Reactions */}
                {Object.values(reactionGroups).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.values(reactionGroups).map(({ emoji, count, isMine }) => (
                      <button key={emoji} type="button"
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
                          isMine ? 'bg-indigo/10 border-indigo/30 text-indigo' : 'bg-surface border-border text-ink hover:bg-bg'
                        }`}>
                        {emoji} {count > 1 && <span>{count}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {/* Timestamp + actions — always visible for last in group, hover-only otherwise */}
                <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''} ${isLastInGroup ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'} transition-opacity`}>
                  <span className="text-[10px] text-faint mx-1">{formatTime(msg.createdAt)}</span>
                  {isMe && isLastMyMsg && (
                    <span className={`text-[10px] font-medium ${isSeen ? 'text-indigo' : 'text-faint'}`}>
                      {isSeen ? t('messages.seen') : '✓'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)}
                    className="md:opacity-0 md:group-hover:opacity-100 p-0.5 rounded text-faint hover:text-ink transition-all text-xs"
                    title={t('messages.react')}
                  >
                    <span>😊</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(msg)}
                    className="md:opacity-0 md:group-hover:opacity-100 p-0.5 rounded text-faint hover:text-ink transition-all"
                    title={t('messages.reply')}
                  >
                    <Reply size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForwardMsg(msg)}
                    className="md:opacity-0 md:group-hover:opacity-100 p-0.5 rounded text-faint hover:text-ink transition-all"
                    title={t('messages.forward')}
                  >
                    <Forward size={12} />
                  </button>
                  {!isFileMsg && !isPollMsg && !isMeetingMsg && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="md:opacity-0 md:group-hover:opacity-100 p-0.5 rounded text-faint hover:text-ink transition-all"
                      title={t('messages.copy')}
                    >
                      <Copy size={12} />
                    </button>
                  )}
                  {isMe && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      disabled={deletingMsgId === msg.id}
                      className="md:opacity-0 md:group-hover:opacity-100 p-0.5 rounded text-faint hover:text-danger transition-all disabled:opacity-30"
                      title={t('common.delete')}
                    >
                      {deletingMsgId === msg.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Trash2 size={12} />
                      }
                    </button>
                  )}
                </div>
                {emojiPickerMsgId === msg.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setEmojiPickerMsgId(null)} />
                    <div className={`relative z-50 flex gap-1 p-1.5 bg-surface border border-border rounded-xl shadow-lg ${isMe ? 'flex-row-reverse' : ''}`}>
                      {QUICK_EMOJIS.map(e => (
                        <button key={e} type="button" onClick={() => toggleReaction(msg.id, e)}
                          className="w-8 h-8 rounded-lg text-lg hover:bg-bg transition-colors flex items-center justify-center">
                          {e}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-3 border-t border-border bg-surface shrink-0">
        {replyingTo && (() => {
          const isPhoto = replyingTo.files?.length && /\.(png|jpg|jpeg|gif|webp)$/i.test(replyingTo.content.replace('📎 ', ''))
          const isFile = replyingTo.files?.length && !isPhoto
          const isPoll = replyingTo.content.startsWith('__poll__')
          const isMeeting = replyingTo.content.startsWith('__meeting__')
          const replyAuthor = replyingTo.senderId === currentUser.id
            ? t('common.you')
            : (() => { const u = orgUsers.find(u => u.id === replyingTo.senderId); return u ? `${u.firstName} ${u.lastName}` : '—' })()
          const preview = isPoll ? `📊 ${t('messages.pollLabel')}` : isMeeting ? `📅 ${t('messages.meetingLabel')}` : isFile ? replyingTo.content.replace('📎 ', '') : replyingTo.content.slice(0, 80)
          return (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-indigo/5 border border-indigo/20 rounded-lg">
              <Reply size={12} className="text-indigo shrink-0" />
              {isPhoto && replyingTo.files?.[0] && (
                <ReplyPhotoThumb storagePath={replyingTo.files[0]} conversationId={channel.id} orgId={currentOrg.id} />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-indigo">{replyAuthor}</div>
                <div className="text-xs text-muted truncate">{preview}</div>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="text-faint hover:text-muted shrink-0">
                <X size={12} />
              </button>
            </div>
          )
        })()}
        {uploadError && (
          <div className="flex items-start gap-2 mb-2 px-3 py-2 bg-danger/5 border border-danger/20 rounded-lg">
            <AlertCircle size={13} className="text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="ml-auto text-faint hover:text-muted"><X size={12} /></button>
          </div>
        )}
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <div className="flex items-center gap-2">
          {/* "+" shortcuts menu */}
          <div className="relative shrink-0">
            <button onClick={() => setShowPlusMenu(m => !m)} disabled={uploading}
              className="p-2.5 rounded-xl text-muted hover:text-indigo hover:bg-indigo-pale transition-colors disabled:opacity-40">
              {uploading ? <Loader2 size={18} className="animate-spin text-indigo" /> : <Plus size={18} />}
            </button>
            {showPlusMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPlusMenu(false)} />
                <div className="absolute left-0 bottom-12 z-50 bg-surface border border-border rounded-xl shadow-xl overflow-hidden w-48">
                  <button onClick={() => { setShowPlusMenu(false); fileRef.current?.click() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-bg">
                    <Paperclip size={14} className="text-indigo shrink-0" /> {t('messages.fileLabel')}
                  </button>
                  <button onClick={() => { setShowPlusMenu(false); photoRef.current?.click() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-bg border-t border-border">
                    <Image size={14} className="text-emerald-500 shrink-0" /> {t('messages.photo')}
                  </button>
                  <button onClick={() => { setShowPlusMenu(false); setShowMeetingForm(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-bg border-t border-border">
                    <Calendar size={14} className="text-amber-500 shrink-0" /> {t('messages.meetingLabel')}
                  </button>
                  <button onClick={() => { setShowPlusMenu(false); setShowPollForm(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-bg border-t border-border">
                    <BarChart2 size={14} className="text-indigo shrink-0" /> {t('messages.pollLabel')}
                  </button>
                </div>
              </>
            )}
          </div>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && text.trim()) { e.preventDefault(); handleSend() } }}
            placeholder={t('messages.messagePlaceholder', { name: channel.name.split(' ')[0] })}
            className="flex-1 px-4 py-3 bg-bg border border-border rounded-full text-sm text-ink placeholder-faint focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent" />
          <button onClick={handleSend} disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-indigo flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {showPollForm && (
        <PollForm onClose={() => setShowPollForm(false)} onSubmit={handlePollCreate} />
      )}
      {showMeetingForm && (
        <QuickMeetingForm
          orgUsers={orgUsers}
          currentUser={currentUser}
          currentOrg={currentOrg}
          prefillParticipants={channel.members.filter(id => id !== currentUser.id)}
          onClose={() => setShowMeetingForm(false)}
          onCreated={async (title, startAt, endAt, participants) => {
            const { EventService } = await import('../../services/event.service')
            await EventService.create({
              organizationId: currentOrg.id,
              title,
              startAt,
              endAt,
              participants: [currentUser.id, ...participants],
              createdById: currentUser.id,
              status: 'scheduled',
            })
            const meetingPayload = JSON.stringify({ title, startAt, endAt })
            const { error: sendErr } = await MessageService.send(channel.id, currentUser.id, `__meeting__:${meetingPayload}`, currentOrg.id, undefined, channel.type)
            if (sendErr) setUploadError(sendErr)
          }}
        />
      )}

      {promoteFile && <PromoteModal file={promoteFile} conversationId={channel.id} onClose={() => setPromoteFile(null)} />}

      {forwardMsg && (
        <ForwardModal
          msg={forwardMsg}
          channels={channels}
          currentChannel={channel}
          currentUser={currentUser}
          currentOrg={currentOrg}
          onClose={() => setForwardMsg(null)}
        />
      )}

      {filePreview && (
        <FilePreviewModal
          storagePath={filePreview.storagePath}
          fileName={filePreview.fileName}
          fileSize={filePreview.fileSize}
          conversationId={channel.id}
          orgId={currentOrg.id}
          onClose={() => setFilePreview(null)}
          onSaveToMyDocs={() => {
            const att: Attachment = {
              id: `prev-${Date.now()}`,
              name: filePreview.fileName,
              size: filePreview.fileSize,
              type: filePreview.fileName.split('.').pop() ?? '',
              storagePath: filePreview.storagePath,
            }
            setPromoteFile(att)
          }}
        />
      )}
    </div>
  )
}

/* ── Main ── */
export function Messages() {
  const { t } = useTranslation()
  const { currentUser, currentOrg } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [orgUsers, setOrgUsers] = useState<AppUser[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showNewDirect, setShowNewDirect] = useState(false)

  // Only collaborator accounts (role='member') appear as contacts — admin-only accounts are excluded
  const contacts = orgUsers.filter(u => u.id !== currentUser.id && u.status === 'active' && u.role === 'member')

  async function loadChannels(): Promise<Channel[]> {
    const convs = await MessageService.getConversations(currentOrg.id, currentUser.id)
    setChannels(convs)
    return convs
  }

  function handleLeaveChannel(channelId: string) {
    setChannels(prev => prev.filter(c => c.id !== channelId))
    setSelected(null)
  }

  useEffect(() => {
    async function init() {
      const [allTeams, convs] = await Promise.all([
        TeamService.getByOrganizationWithMembers(currentOrg.id),
        MessageService.getConversations(currentOrg.id, currentUser.id),
      ])
      setTeams(allTeams)

      const myTeams = allTeams.filter(t => t.members.includes(currentUser.id))
      const channelTeamIds = new Set(convs.filter(c => c.type === 'team').map(c => c.teamId))
      const missing = myTeams.filter(t => !channelTeamIds.has(t.id))

      if (missing.length > 0) {
        await Promise.all(missing.map(t =>
          TeamService.ensureTeamConversation(t.id, currentOrg.id, t.members)
        ))
        const updated = await MessageService.getConversations(currentOrg.id, currentUser.id)
        setChannels(updated)
      } else {
        setChannels(convs)
      }
    }

    init()
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
  }, [currentOrg.id, currentUser.id])

  const selectedChannel = channels.find(c => c.id === selected) ?? null

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`${selected ? 'hidden md:flex' : 'flex'} md:w-80 w-full flex-col border-r border-border bg-surface shrink-0 overflow-hidden`}>
        <ConvList
          channels={channels}
          onSelect={setSelected}
          selected={selected}
          onNewDirect={() => setShowNewDirect(true)}
          onNewGroup={() => setShowNewGroup(true)}
          orgUsers={orgUsers}
          currentUserId={currentUser.id}
        />
      </div>
      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden bg-bg`}>
        {selectedChannel ? (
          <ConvView
            channel={selectedChannel}
            channels={channels}
            orgUsers={orgUsers}
            teams={teams}
            onBack={() => setSelected(null)}
            onLeaveChannel={handleLeaveChannel}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-pale flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-indigo">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-ink mb-3">{t('messages.selectConversation')}</h3>
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { icon: User, label: t('messages.directs'), desc: t('messages.directDesc') },
                { icon: Lock, label: t('messages.groups'), desc: t('messages.groupDesc') },
                { icon: Hash, label: t('messages.teams'), desc: t('messages.teamDesc') },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2 text-left">
                  <Icon size={14} className="text-indigo shrink-0" />
                  <span className="text-xs text-muted"><span className="font-semibold text-ink">{label}</span> · {desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showNewDirect && (
        <NewDirectModal
          onClose={() => setShowNewDirect(false)}
          contacts={contacts}
          onCreated={channelId => {
            loadChannels().then(() => setSelected(channelId))
          }}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          orgUsers={contacts}
          onCreated={loadChannels}
        />
      )}
    </div>
  )
}
