import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { NotificationService } from '../../services/notification.service'
import type { Notification } from '../../lib/types'

export function NotificationBell({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>(() =>
    NotificationService.getForUser(currentUser.id)
  )

  const unread = notifs.filter(n => !n.read).length

  function markAll() {
    NotificationService.markAllRead(currentUser.id)
    setNotifs(NotificationService.getForUser(currentUser.id))
  }

  function markOne(id: string) {
    NotificationService.markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2 rounded-lg transition-colors ${
          variant === 'dark'
            ? 'text-indigo-light hover:bg-navy-light hover:text-white'
            : 'text-muted hover:text-ink hover:bg-bg'
        }`}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 bg-surface border border-border rounded-2xl shadow-xl shadow-black/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-ink">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-indigo font-medium hover:underline">
                  Tout marquer lu
                </button>
              )}
            </div>

            {notifs.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted">Tout est à jour.</div>
            ) : (
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {notifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markOne(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-bg transition-colors ${
                      n.read ? '' : 'bg-indigo-pale/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${n.read ? 'text-muted' : 'text-ink font-medium'}`}>
                        {String(n.payload?.text ?? n.type)}
                      </p>
                      <p className="text-[10px] text-faint mt-0.5">{n.createdAt}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo mt-2 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
