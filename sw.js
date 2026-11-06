/* StorySpark service worker: lets the app install to the home screen and open offline.
   The built-in story maker needs no network, so the whole app works without one. */
const CACHE = "storyspark-v4";
const SHELL = ["/", "/index.html", "/styles.css", "/app.js", "/story-data.js", "/story-engine.js", "/extras.js", "/favicon.svg", "/manifest.webmanifest",
  "/fonts/Poppins-Regular.ttf", "/fonts/Poppins-Bold.ttf", "/fonts/Lora-Variable.ttf", "/icons/icon-192.png", "/icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  // pages: try the network first so updates show up, fall back to the saved copy when offline
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("/index.html", copy)); return res; }).catch(() => caches.match("/index.html")));
    return;
  }
  // files: serve the saved copy, refresh it in the background
  e.respondWith(caches.match(r).then((hit) => {
    const net = fetch(r).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
