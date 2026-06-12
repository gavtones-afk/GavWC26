// Network-first for the page so updates always show when online; cache is fallback only.
const CACHE = "wc26-v2";
const SHELL = ["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"];

self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{})); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.includes("/api/") || url.pathname.includes("/.netlify/functions/")) return; // never cache live data
  const isDoc = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isDoc) { // always try the network first for the page itself
    e.respondWith(fetch(req).then(r => { const cc = r.clone(); caches.open(CACHE).then(c => c.put(req, cc)); return r; }).catch(() => caches.match(req).then(c => c || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(c => c || fetch(req).then(r => { const cc = r.clone(); caches.open(CACHE).then(ch => ch.put(req, cc)); return r; })));
});
self.addEventListener("push", e => { let d = { title: "World Cup 2026", body: "Update" }; try { d = e.data.json(); } catch (_) {} e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "icons/icon-192.png", badge: "icons/icon-192.png" })); });
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(clients.matchAll({ type: "window" }).then(cs => cs.length ? cs[0].focus() : clients.openWindow("./index.html"))); });
