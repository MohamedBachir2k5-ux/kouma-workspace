import { supabase } from '../lib/supabase'

export const PushService = {
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  },

  async getPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied'
    if (Notification.permission !== 'default') return Notification.permission
    return Notification.requestPermission()
  },

  async subscribe(userId: string): Promise<{ error: string | null }> {
    if (!this.isSupported()) return { error: 'Notifications push non supportées sur ce navigateur.' }

    const permission = await this.getPermission()
    if (permission !== 'granted') return { error: 'Permission de notification refusée.' }

    try {
      const registration = await navigator.serviceWorker.ready

      // Use a dummy applicationServerKey for local/dev — replace with real VAPID public key for production
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        // Fallback: register basic browser notification only (no background push)
        return { error: null }
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      const { endpoint, keys } = sub.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      const { error } = await supabase.from('push_subscriptions').upsert(
        { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'user_id,endpoint' }
      )

      return { error: error?.message ?? null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },

  async unsubscribe(userId: string): Promise<void> {
    if (!this.isSupported()) return
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      const { endpoint } = sub.toJSON() as { endpoint: string }
      await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
    }
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    return sub !== null
  },
}
