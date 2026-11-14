/* StorySpark service worker: makes the app work offline.
   - App files: served from cache first, refreshed in the background.
   - Pages: network first, falling back to the saved copy when offline.
   - /api/ (Magic mode AI): never cached. Offline, the app's built-in story maker is used.
   Bump VERSION if you ever need to force every visitor to drop the old cache. */
const VERSION = 'storyspark-v6';
const CORE = ['index.html', 'styles.css', 'app.js', 'story-data.js', 'story-expand.js', 'story-engine.js', 'extras.js', 'favicon.svg', 'manifest.webmanifest', 'pwa.js', 'pwa.css', 'aesthetic.css', 'aesthetic.js', 'scene.css', 'scene.js', 'cinema.css', 'readable.css', 'cinema.js', 'scenes/manifest.json', 'scenes/romance-m.webp', 'scenes/darkromance-m.webp', 'scenes/horror-m.webp', 'scenes/mystery-m.webp', 'scenes/thriller-m.webp', 'scenes/fantasy-m.webp', 'scenes/adventure-m.webp', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'covers/romance-1.webp', 'covers/romance-2.webp', 'covers/darkromance-1.webp', 'covers/darkromance-2.webp', 'covers/horror-1.webp', 'covers/fantasy-1.webp', 'covers/fantasy-2.webp', 'covers/mystery-1.webp', 'covers/adventure-1.webp'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('storyspark-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d === 'SKIP_WAITING' || d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'CACHE_URLS' && Array.isArray(d.urls)) {
    e.waitUntil((async () => {
      const c = await caches.open(VERSION);
      let n = 0;
      for (const u of d.urls) {
        try {
          const url = new URL(u, self.location.origin);
          if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) continue;
          if (await c.match(url.href)) { n++; continue; }
          const res = await fetch(url.href);
          if (res.ok && res.type === 'basic') { await c.put(url.href, res); n++; }
        } catch (_) {}
      }
      const all = await self.clients.matchAll();
      all.forEach(cl => cl.postMessage({ type: 'CACHED', count: n }));
    })());
  }
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (u.pathname.startsWith('/api/')) return;          // AI calls always go to the network

  if (r.mode === 'navigate') {                         // opening the app or a share link
    e.respondWith((async () => {
      try {
        const res = await fetch(r);
        if (res.ok && (res.headers.get('content-type') || '').includes('text/html') && (u.pathname === '/' || u.pathname.endsWith('/index.html'))) {
          const c = await caches.open(VERSION); c.put('index.html', res.clone());
        }
        return res;
      } catch (_) {
        return (await caches.match('index.html')) || Response.error();
      }
    })());
    return;
  }

  if (/\.(css|js|webmanifest)$/.test(u.pathname)) {      // code and styles: newest first, cache only when offline
    e.respondWith((async () => {
      const c = await caches.open(VERSION);
      try { const res = await fetch(r); if (res.ok && res.type === 'basic') c.put(r, res.clone()); return res; }
      catch (_) { return (await c.match(r)) || Response.error(); }
    })());
    return;
  }

  e.respondWith((async () => {                         // fonts and images: cache first
    const c = await caches.open(VERSION);
    const hit = await c.match(r);
    const net = fetch(r).then(res => { if (res.ok && res.type === 'basic') c.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});
