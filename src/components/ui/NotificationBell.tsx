import { useState, useEffect, useCallback } from 'react'
import { Bell, MessageCircle, Calendar, Users, Info, Shield, Megaphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NotificationService } from '../../services/notification.service'
import { PushService } from '../../services/push.service'
import { supabase } from '../../lib/supabase'
import type { Notification } from '../../lib/types'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "À l'instant"
  const m = Math.floor(s / 60)
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h} h`
  const d = Math.floor(h / 24)
  return `Il y a ${d} j`
}

function notifIcon(type: string) {
  switch (type) {
    case 'new_message':       return <MessageCircle size={14} className="text-indigo shrink-0 mt-0.5" />
    case 'meeting_invite':    return <Calendar size={14} className="text-amber-500 shrink-0 mt-0.5" />
    case 'team_member_added': return <Users size={14} className="text-emerald-500 shrink-0 mt-0.5" />
    case 'member_joined':     return <Users size={14} className="text-emerald-500 shrink-0 mt-0.5" />
    case 'role_changed':      return <Shield size={14} className="text-indigo shrink-0 mt-0.5" />
    case 'announcement':      return <Megaphone size={14} className="text-amber-500 shrink-0 mt-0.5" />
    case 'event_reminder':    return <Calendar size={14} className="text-indigo shrink-0 mt-0.5" />
    default:                  return <Info size={14} className="text-muted shrink-0 mt-0.5" />
  }
}

function notifRoute(n: Notification): string {
  switch (n.type) {
    case 'new_message':       return '/app/messages'
    case 'meeting_invite':    return '/app/agenda'
    case 'team_member_added': return '/app/equipes'
    case 'member_joined':     return '/app/messages'
    case 'role_changed':      return '/app/messages'
    case 'announcement':      return '/app/messages'
    case 'event_reminder':    return '/app/agenda'
    default:                  return '/app/messages'
  }
}

function showBrowserNotification(n: Notification) {
  if (Notification.permission !== 'granted') return
  new Notification(
    n.type === 'new_message' ? 'Nouveau message' :
    n.type === 'meeting_invite' ? 'Invitation réunion' :
    n.type === 'team_member_added' ? 'Ajout à une équipe' : 'Kouma',
    {
      body: String(n.payload?.text ?? ''),
      icon: '/favicon.svg',
      tag: n.id,
    }
  )
}

export function NotificationBell({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])

  // Register Web Push subscription only if permission already granted (never auto-request)
  useEffect(() => {
    if (!currentUser.id || currentUser.id === 'u1') return
    if (!PushService.isSupported()) return
    if (Notification.permission !== 'granted') return
    PushService.isSubscribed().then(already => {
      if (!already) PushService.subscribe(currentUser.id)
    })
  }, [currentUser.id])

  const addNotif = useCallback((n: Notification) => {
    setNotifs(prev => [n, ...prev])
    // Only show browser notification if the tab is hidden
    if (document.hidden) {
      showBrowserNotification(n)
    }
  }, [])

  useEffect(() => {
    if (!currentUser.id || currentUser.id === 'u1') return
    NotificationService.getForUser(currentUser.id).then(setNotifs)

    const key = `notifs-${currentUser.id}-${Math.random().toString(36).slice(2, 8)}`
    const channel = supabase
      .channel(key)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`,
      }, payload => {
        const r = payload.new as {
          id: string; user_id: string; type: string
          payload: Record<string, unknown> | null; read: boolean; created_at: string
        }
        addNotif({
          id: r.id, userId: r.user_id, type: r.type,
          payload: r.payload, read: r.read, createdAt: r.created_at,
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUser.id, addNotif])

  const unread = notifs.filter(n => !n.read).length

  async function markAll() {
    await NotificationService.markAllRead(currentUser.id)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      // For new_message, mark all unread notifications from the same conversation as read
      if (n.type === 'new_message' && n.payload?.conversationId) {
        const convId = String(n.payload.conversationId)
        await NotificationService.markAllByConversation(currentUser.id, convId)
        setNotifs(prev => prev.map(x =>
          x.type === 'new_message' && String(x.payload?.conversationId) === convId
            ? { ...x, read: true }
            : x
        ))
      } else {
        await NotificationService.markRead(n.id)
        setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      }
    }
    setOpen(false)
    navigate(notifRoute(n))
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
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-bg transition-colors ${
                      n.read ? '' : 'bg-indigo-pale/40'
                    }`}
                  >
                    {notifIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${n.read ? 'text-muted' : 'text-ink font-medium'}`}>
                        {String(n.payload?.text ?? n.type)}
                      </p>
                      <p className="text-[10px] text-faint mt-0.5">{relativeTime(n.createdAt)}</p>
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
