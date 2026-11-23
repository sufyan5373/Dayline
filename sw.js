const CACHE = 'dayline-v1';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Network first so new deploys show up; cached copy when offline.
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('/', copy)); return r; })
        .catch(() => caches.match('/'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return r;
    }))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow('/');
    })
  );
});
