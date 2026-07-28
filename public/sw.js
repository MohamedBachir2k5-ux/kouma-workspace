// Kouma Service Worker — handles Web Push and offline caching

const CACHE_NAME = 'kouma-shell-v1'
const SHELL_ASSETS = ['/', '/app/messages', '/manifest.json', '/favicon.svg']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS).catch(() => {}))
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Network-first for API calls; cache-first for static shell assets
self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Skip Supabase API requests — always network
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && SHELL_ASSETS.includes(url.pathname)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then(cached => cached ?? caches.match('/')))
  )
})

// Push notification received from server
self.addEventListener('push', event => {
  const data = event.data?.json?.() ?? {}
  const title = data.title ?? 'Kouma'
  const options = {
    body: data.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag ?? 'kouma-notif',
    data: { url: data.url ?? '/app/messages' },
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// User clicks the notification
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/app/messages'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
