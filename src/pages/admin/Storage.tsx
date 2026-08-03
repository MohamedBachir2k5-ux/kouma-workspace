import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { DocumentService } from '../../services/document.service'
import { UserService } from '../../services/user.service'
import { FileText, File, Table } from 'lucide-react'
import { formatFileSize } from '../../lib/utils'
import type { Document, User } from '../../lib/types'

const deptColors: Record<string, string> = {
  Finance:      'bg-amber',
  RH:           'bg-indigo',
  Direction:    'bg-navy',
  Juridique:    'bg-violet-500',
  Commercial:   'bg-success',
  Informatique: 'bg-sky-500',
}

function FileIcon({ type, size = 16 }: { type: string; size?: number }) {
  if (type === 'pdf')  return <FileText size={size} className="text-danger" />
  if (type === 'xlsx') return <Table    size={size} className="text-success" />
  return <File size={size} className="text-indigo" />
}

function ProgressBar({ value, total, color = 'bg-indigo' }: { value: number; total: number; color?: string }) {
  const pct = Math.min(100, total > 0 ? (value / total) * 100 : 0)
  return (
    <div className="h-2 bg-bg rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function AdminStorage() {
  const { t } = useTranslation()
  const { currentOrg, storageQuotaBytes } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [totalUsed, setTotalUsed] = useState(0)
  const [orgUsers, setOrgUsers] = useState<User[]>([])

  useEffect(() => {
    DocumentService.list(currentOrg.id).then(setDocs)
    DocumentService.totalUsed(currentOrg.id).then(setTotalUsed)
    UserService.getByOrganizationWithRole(currentOrg.id).then(setOrgUsers)
  }, [currentOrg.id])

  const pct = storageQuotaBytes > 0 ? ((totalUsed / storageQuotaBytes) * 100).toFixed(1) : '0.0'

  const byDept: Record<string, number> = {}
  docs.forEach(d => {
    const uploader = orgUsers.find(u => u.id === d.ownerId)
    const dept = uploader?.department ?? t('common.other')
    byDept[dept] = (byDept[dept] ?? 0) + d.size
  })

  const byType: Record<string, { count: number; size: number }> = {}
  docs.forEach(d => {
    if (!byType[d.type]) byType[d.type] = { count: 0, size: 0 }
    byType[d.type].count++
    byType[d.type].size += d.size
  })

  const sortedDocs = [...docs].sort((a, b) => b.size - a.size)

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">{t('admin.storageTitle')}</h1>
        <p className="text-sm text-muted mt-0.5">{t('admin.storageSubtitle')}</p>
      </div>

      {/* Global */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide font-semibold mb-1">{t('admin.totalStorage')}</p>
            <p className="text-3xl font-bold text-navy">{formatFileSize(totalUsed)}</p>
            <p className="text-sm text-muted mt-0.5">{t('admin.storageAvailable', { value: formatFileSize(storageQuotaBytes) })}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-ink">{pct}%</p>
            <p className="text-xs text-muted">{t('admin.storageUsedPct')}</p>
          </div>
        </div>
        <ProgressBar
          value={totalUsed}
          total={storageQuotaBytes}
          color={Number(pct) > 80 ? 'bg-danger' : Number(pct) > 60 ? 'bg-amber' : 'bg-success'}
        />
        <p className="text-xs text-muted mt-2">
          {t(docs.length !== 1 ? 'admin.storageRemainingPlural' : 'admin.storageRemaining', { size: formatFileSize(storageQuotaBytes - totalUsed), count: docs.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* By dept */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-ink mb-4">{t('admin.byDept')}</h2>
          <div className="space-y-3">
            {Object.entries(byDept).sort((a, b) => b[1] - a[1]).map(([dept, size]) => (
              <div key={dept}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${deptColors[dept] ?? 'bg-muted'}`} />
                    <span className="text-xs font-medium text-ink">{dept}</span>
                  </div>
                  <span className="text-xs text-muted">{formatFileSize(size)}</span>
                </div>
                <ProgressBar value={size} total={totalUsed} color={deptColors[dept] ?? 'bg-muted'} />
              </div>
            ))}
          </div>
        </div>

        {/* By type */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-ink mb-4">{t('admin.byFileType')}</h2>
          <div className="space-y-3">
            {Object.entries(byType).sort((a, b) => b[1].size - a[1].size).map(([type, data]) => (
              <div key={type} className="flex items-center gap-3 p-3 bg-bg rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                  <FileIcon type={type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-ink uppercase">{type}</span>
                    <span className="text-xs text-muted">{formatFileSize(data.size)}</span>
                  </div>
                  <span className="text-[10px] text-muted">{t(data.count !== 1 ? 'admin.fileCountPlural' : 'admin.fileCount', { count: data.count })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Largest files */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-bg">
          <h2 className="text-sm font-bold text-ink">{t('admin.largestFiles')}</h2>
        </div>
        {sortedDocs.map((doc, idx) => {
          const uploader = orgUsers.find(u => u.id === doc.ownerId)
          return (
            <div key={doc.id} className={`flex items-center gap-4 px-5 py-3.5 ${idx < sortedDocs.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center shrink-0">
                <FileIcon type={doc.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">{doc.name}</div>
                {uploader && <div className="text-xs text-muted">{uploader.firstName} {uploader.lastName}</div>}
              </div>
              <span className="text-sm font-semibold text-ink shrink-0">{formatFileSize(doc.size)}</span>
            </div>
          )
        })}
        {sortedDocs.length === 0 && (
          <div className="py-10 text-center text-sm text-muted">{t('admin.noFiles')}</div>
        )}
      </div>
    </div>
  )
}
