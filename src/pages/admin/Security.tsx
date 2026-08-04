import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Clock, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { AuditService } from '../../services/audit.service'
import { OrganizationService } from '../../services/organization.service'
import type { AuditLog } from '../../lib/types'

const SECURITY_ACTIONS = new Set(['recovery_initiated', 'recovery_completed', 'breakglass_used'])

function inviteExpiryToLabel(days: number | null): string {
  if (days === null) return 'never'
  if (days === 1)    return '24h'
  if (days === 30)   return '30d'
  return '7d'
}

function labelToInviteExpiryDays(label: string): number | null {
  if (label === 'never') return null
  if (label === '24h')   return 1
  if (label === '30d')   return 30
  return 7
}

export function AdminSecurity() {
  const { t, i18n } = useTranslation()
  const { currentOrg } = useAuth()

  const [sessionDuration, setSessionDuration] = useState('30')
  const [inviteExpiry, setInviteExpiry] = useState('7d')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [securityLogs, setSecurityLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    OrganizationService.getSecuritySettings(currentOrg.id).then(s => {
      setSessionDuration(String(s.sessionDurationDays))
      setInviteExpiry(inviteExpiryToLabel(s.inviteExpiryDays))
    })
    AuditService.getLogs(currentOrg.id).then(all => {
      setSecurityLogs(all.filter(l => SECURITY_ACTIONS.has(l.action)).slice(0, 10))
    })
  }, [currentOrg.id])

  function formatTs(iso: string) {
    const d = new Date(iso)
    const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'pt' ? 'pt-BR' : 'en-GB'
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  function actionLabel(action: string) {
    if (action === 'breakglass_used') return t('admin.actBreakglass')
    return t('admin.actRecovery')
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    const { error } = await OrganizationService.saveSecuritySettings(currentOrg.id, {
      inviteExpiryDays: labelToInviteExpiryDays(inviteExpiry),
      sessionDurationDays: Number(sessionDuration),
    })
    setSaving(false)
    if (error) { setSaveError(error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">{t('admin.securityTitle')}</h1>
        <p className="text-sm text-muted mt-0.5">{t('admin.securitySubtitle')}</p>
      </div>

      {/* Security settings */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-5">
        <div className="px-5 py-3.5 border-b border-border bg-bg flex items-center gap-2">
          <Shield size={16} className="text-muted" />
          <h2 className="text-sm font-bold text-ink">{t('admin.securitySettings')}</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-sm font-medium text-ink">{t('admin.sessionDuration')}</div>
              <div className="text-xs text-muted">{t('admin.sessionDurationHint')}</div>
            </div>
            <select value={sessionDuration} onChange={e => setSessionDuration(e.target.value)}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy">
              <option value="7">{t('admin.days7')}</option>
              <option value="30">{t('admin.days30')}</option>
              <option value="90">{t('admin.days90')}</option>
              <option value="365">{t('admin.year1')}</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-sm font-medium text-ink">{t('admin.inviteExpiry')}</div>
              <div className="text-xs text-muted">{t('admin.inviteExpiryHint')}</div>
            </div>
            <select value={inviteExpiry} onChange={e => setInviteExpiry(e.target.value)}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy">
              <option value="24h">{t('admin.hours24')}</option>
              <option value="7d">{t('admin.days7')}</option>
              <option value="30d">{t('admin.days30')}</option>
              <option value="never">{t('admin.neverExpires')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Org security events */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-5">
        <div className="px-5 py-3.5 border-b border-border bg-bg flex items-center gap-2">
          <Activity size={16} className="text-muted" />
          <h2 className="text-sm font-bold text-ink">{t('admin.orgSecurityEvents')}</h2>
        </div>
        {securityLogs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">{t('admin.noSecurityEvents')}</div>
        ) : (
          securityLogs.map((log, idx) => (
            <div key={log.id} className={`flex items-start gap-3 px-5 py-4 ${idx < securityLogs.length - 1 ? 'border-b border-border' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                log.action === 'breakglass_used' ? 'bg-danger/10' : 'bg-amber/10'
              }`}>
                <AlertTriangle size={14} className={log.action === 'breakglass_used' ? 'text-danger' : 'text-amber'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">{actionLabel(log.action)}</p>
                {log.detail && <p className="text-xs text-muted mt-0.5">{log.detail}</p>}
                <div className="flex items-center gap-1 text-xs text-faint mt-0.5">
                  <Clock size={10} />
                  {formatTs(log.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {saveError && <p className="mb-3 text-sm text-danger">{saveError}</p>}

      <button onClick={save} disabled={saving}
        className={`px-5 py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${saved ? 'bg-success text-white' : 'bg-navy text-white hover:bg-navy-light'}`}>
        {saving ? t('admin.saving') : saved ? t('admin.saved') : t('admin.saveSettings')}
      </button>
    </div>
  )
}
