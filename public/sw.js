// Kouma Service Worker — offline caching + Web Push

const CACHE_NAME = 'kouma-shell-v2'

// Shell assets to pre-cache on install
const SHELL_ASSETS = ['/', '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS).catch(() => {}))
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Never intercept Supabase API / auth / realtime — must always hit the network
  if (
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/realtime/')
  ) return

  // Same-origin JS + CSS bundles: Vite adds content hashes → immutable, cache-first
  if (url.origin === self.location.origin && /\.(js|css)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached ?? fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(c => c.put(request, clone))
          }
          return response
        })
      )
    )
    return
  }

  // Everything else from same origin (HTML, manifest, icons):
  // network-first, fall back to cache so the SPA shell loads offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(c => c.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then(cached => cached ?? caches.match('/'))
        )
    )
  }
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

// User taps the notification
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
