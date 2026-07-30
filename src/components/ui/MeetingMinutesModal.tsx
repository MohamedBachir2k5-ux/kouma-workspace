import { useState } from 'react'
import { X, Plus, Trash2, CheckCircle2, ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MeetingMinutesService } from '../../services/meeting-minutes.service'
import { Avatar } from './Avatar'
import type { Event, User } from '../../lib/types'

interface ActionDraft {
  description: string
  assigneeId: string
  dueDate: string
}

interface Props {
  event: Event
  orgUsers: User[]
  organizationId: string
  createdBy: string
  onSaved: () => void
  onSkip: () => void
  onClose: () => void
}

export function MeetingMinutesModal({ event, orgUsers, organizationId, createdBy, onSaved, onSkip, onClose }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'prompt' | 'form'>('prompt')
  const [title, setTitle] = useState(event.title)
  const [objective, setObjective] = useState('')
  const [summary, setSummary] = useState('')
  const [decisions, setDecisions] = useState('')
  const [notes, setNotes] = useState('')
  const [actions, setActions] = useState<ActionDraft[]>([{ description: '', assigneeId: '', dueDate: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addAction() {
    setActions(prev => [...prev, { description: '', assigneeId: '', dueDate: '' }])
  }

  function removeAction(i: number) {
    setActions(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAction(i: number, field: keyof ActionDraft, value: string) {
    setActions(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    setError(null)

    const { error: err } = await MeetingMinutesService.create(
      {
        eventId: event.id,
        organizationId,
        createdBy,
        title: title.trim(),
        objective: objective.trim() || undefined,
        summary: summary.trim() || undefined,
        decisions: decisions.trim() || undefined,
        notes: notes.trim() || undefined,
        participants: event.participants,
      },
      actions
        .filter(a => a.description.trim())
        .map(a => ({
          description: a.description,
          assigneeId: a.assigneeId || undefined,
          dueDate: a.dueDate || undefined,
        })),
    )

    setSaving(false)
    if (err) { setError(err); return }
    onSaved()
  }

  if (step === 'prompt') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-pale flex items-center justify-center mb-4">
              <ClipboardList size={22} className="text-indigo" />
            </div>
            <h2 className="text-base font-bold text-navy mb-1">{t('minutes.createPromptTitle')}</h2>
            <p className="text-xs text-muted leading-relaxed">{event.title}</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setStep('form')}
              className="w-full py-3 bg-indigo text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              {t('minutes.createNow')}
            </button>
            <button
              onClick={onSkip}
              className="w-full py-2.5 border border-border text-sm font-medium text-muted rounded-xl hover:bg-bg transition-colors"
            >
              {t('minutes.skipForNow')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <ClipboardList size={18} className="text-indigo" />
            <h3 className="font-bold text-navy text-sm">{t('minutes.title')}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-bg">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meeting title */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('minutes.meetingTitle')}</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>

          {/* Objective */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('minutes.objective')}</label>
            <textarea
              value={objective}
              onChange={e => setObjective(e.target.value)}
              rows={2}
              placeholder={`${t('minutes.objective')}…`}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('minutes.summary')}</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={3}
              placeholder={`${t('minutes.summary')}…`}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>

          {/* Decisions */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('minutes.decisions')}</label>
            <textarea
              value={decisions}
              onChange={e => setDecisions(e.target.value)}
              rows={3}
              placeholder={`${t('minutes.decisions')}…`}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ink uppercase tracking-wide">{t('minutes.actions')}</label>
              <button
                type="button"
                onClick={addAction}
                className="flex items-center gap-1 text-xs text-indigo font-medium hover:opacity-80"
              >
                <Plus size={13} /> {t('minutes.addAction')}
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((action, i) => (
                <div key={i} className="bg-bg border border-border rounded-xl p-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-faint mt-2.5 shrink-0" />
                    <input
                      value={action.description}
                      onChange={e => updateAction(i, 'description', e.target.value)}
                      placeholder={t('minutes.actionPlaceholder')}
                      className="flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
                    />
                    {actions.length > 1 && (
                      <button type="button" onClick={() => removeAction(i)} className="p-1 text-faint hover:text-danger transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-5">
                    <div>
                      <label className="block text-[10px] font-semibold text-faint uppercase tracking-wide mb-1">{t('minutes.assignee')}</label>
                      <select
                        value={action.assigneeId}
                        onChange={e => updateAction(i, 'assigneeId', e.target.value)}
                        className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-indigo"
                      >
                        <option value="">-</option>
                        {orgUsers.filter(u => u.status === 'active').map(u => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-faint uppercase tracking-wide mb-1">{t('minutes.dueDate')}</label>
                      <input
                        type="date"
                        value={action.dueDate}
                        onChange={e => updateAction(i, 'dueDate', e.target.value)}
                        className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo"
                      />
                    </div>
                  </div>
                  {action.assigneeId && (
                    <div className="flex items-center gap-1.5 pl-5">
                      {(() => {
                        const u = orgUsers.find(u => u.id === action.assigneeId)
                        if (!u) return null
                        return (
                          <>
                            <Avatar firstName={u.firstName} lastName={u.lastName} id={u.id} size="sm" src={u.avatarUrl} />
                            <span className="text-xs text-muted">{u.firstName} {u.lastName}</span>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-2">{t('minutes.notes')}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder={`${t('minutes.notes')}…`}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border shrink-0">
          <button onClick={onClose} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-bg">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 py-3 bg-indigo text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {saving ? t('minutes.saving') : t('minutes.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
