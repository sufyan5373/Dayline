const CACHE = 'dayline-v4';
const ASSETS = ['/', '/index.html', '/pdf-viewer.js', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png', '/apple-touch-icon.png'];
// Viewer libraries, cached ahead of time so PDFs and Word files open with no connection.
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js',
  'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'
];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all([
        ...ASSETS.map((a) => c.add(a).catch(() => {})),
        ...LIBS.map((u) => c.add(new Request(u, { mode: 'cors' })).catch(() => {}))
      ]))
      .then(() => self.skipWaiting())
  );
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

  if (url.origin !== location.origin) {
    // Libraries and fonts from known CDNs: cache first, then network (and remember it).
    if (CDN_HOSTS.indexOf(url.hostname) < 0) return;
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return r;
      }))
    );
    return;
  }

  if (req.mode === 'navigate') {
    // Network first so new deploys show up; cached copy when offline.
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('/', copy)); return r; })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Same-origin files: serve the cached copy instantly and refresh it in the background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((r) => {
        if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
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
