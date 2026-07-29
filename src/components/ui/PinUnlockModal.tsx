import { useState } from 'react'
import { KeyRound, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { KeyService } from '../../services/key.service'
import { Avatar } from './Avatar'

interface Props {
  userId: string
  orgId: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  isAdmin: boolean
  onUnlocked: () => void
  onSignOut: () => void
}

export function PinUnlockModal({ userId, orgId, firstName, lastName, email, avatarUrl, isAdmin, onUnlocked, onSignOut }: Props) {
  const { t } = useTranslation()
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const MAX_ATTEMPTS = 5

  async function handleUnlock() {
    if (isAdmin ? !secret.trim() : secret.length !== 6) return
    setLoading(true)
    setError(null)
    const { ok, error: err } = await KeyService.loadUserKeys(userId, secret, orgId)
    setLoading(false)
    if (ok) {
      onUnlocked()
      return
    }
    const next = attempts + 1
    setAttempts(next)
    if (next >= MAX_ATTEMPTS) {
      onSignOut()
      return
    }
    setError(err ?? t('pinUnlock.wrongPin'))
    setSecret('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleUnlock()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-pale flex items-center justify-center mb-4">
            <KeyRound size={20} className="text-indigo" />
          </div>
          <h2 className="text-base font-bold text-navy mb-1">{t('pinUnlock.title')}</h2>
          <p className="text-xs text-muted leading-relaxed">{t('pinUnlock.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border mb-5">
          <Avatar firstName={firstName} lastName={lastName} id={userId} size="sm" src={avatarUrl} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{firstName} {lastName}</p>
            <p className="text-xs text-muted truncate">{email}</p>
          </div>
        </div>

        <div className="space-y-3">
          {isAdmin ? (
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('pinUnlock.passwordPlaceholder')}
              autoFocus
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          ) : (
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={secret}
              onChange={e => setSecret(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={handleKeyDown}
              placeholder="••••••"
              autoFocus
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-center text-xl font-mono tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          )}

          {error && (
            <p className="text-xs text-danger">
              {error}{attempts > 0 && ` (${attempts}/${MAX_ATTEMPTS})`}
            </p>
          )}

          <button
            onClick={handleUnlock}
            disabled={loading || (isAdmin ? !secret.trim() : secret.length !== 6)}
            className="w-full py-3 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? t('pinUnlock.unlocking') : t('pinUnlock.unlock')}
          </button>

          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted hover:text-danger transition-colors"
          >
            <LogOut size={13} />
            {t('pinUnlock.signOut')}
          </button>
        </div>
      </div>
    </div>
  )
}
