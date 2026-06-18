// Stormo PWA Service Worker
// Version bump this string to force all clients to get a fresh SW
const CACHE_VERSION = 'stormo-v3';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL   = '/offline.html';

// Assets to precache during install — must all exist in /public
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/stormo-logo.png',
  '/favicon.png',
  '/icons/web-app-manifest-192x192.png',
];

// ── Install ───────────────────────────────────────────────────────────────────
// Precache critical shell assets so the offline page always renders
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn(`[SW] Precache miss: ${url}`, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
// Remove any caches from old SW versions
self.addEventListener('activate', (event) => {
  const keep = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => !keep.includes(n))
            .map((n) => { console.log(`[SW] Purging old cache: ${n}`); return caches.delete(n); })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isNavigate(req) {
  return req.mode === 'navigate';
}
function isStaticChunk(url) {
  return url.pathname.startsWith('/_next/static/');
}
function isAsset(url) {
  return (
    url.pathname.startsWith('/_next/image/') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot|otf)$/i.test(url.pathname)
  );
}
function isApi(url) {
  return url.pathname.startsWith('/api/');
}
function isHMR(url) {
  return url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.includes('__nextjs');
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // HMR / dev tools — never intercept
  if (isHMR(url)) return;

  // ① API routes — Network only, return structured error when offline
  if (isApi(url)) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ offline: true, error: 'You appear to be offline. Please reconnect.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // ② Next.js hashed build chunks — Cache first (immutable, safe forever)
  if (isStaticChunk(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ③ Images & fonts — Stale-while-revalidate
  if (isAsset(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached); // serve stale on failure

          return cached ?? networkFetch;
        })
      )
    );
    return;
  }

  // ④ Page navigation — Network first, fallback to cached page, then offline page
  if (isNavigate(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return offline ?? new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body style="background:#1A1A1A;color:white;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;gap:16px"><img src="/favicon.png" style="width:72px;height:72px;object-fit:contain;border-radius:18px" alt="Stormo" /><h1>You\'re Offline</h1><p style="color:#888">Stormo needs a connection to work.</p></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
          );
        })
    );
    return;
  }
});

// ── Push Notifications ────────────────────────────────────────────────────────
// Wired up for future use — not yet triggered from the server
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch (_) { data = { body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Stormo', {
      body: data.body || 'You have a new update.',
      icon: '/icons/web-app-manifest-192x192.png',
      badge: '/icons/favicon-96x96.png',
      tag: data.tag || 'stormo-push',
      renotify: false,
      data: { url: data.url || '/dashboard' },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
