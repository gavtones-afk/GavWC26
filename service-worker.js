/* WC26 Matchday Board — service worker
   - Caches the app shell so it opens instantly and works offline
   - Never caches live data (the /api/ or /functions/ calls)
   - Ready to receive push notifications once you wire up a push server
*/
const CACHE = "wc26-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;                 // let POSTs (live data) pass through
  if (url.pathname.includes("/api/") || url.pathname.includes("/functions/")) return;

  // Navigations: serve the cached app shell, fall back to network.
  if (e.request.mode === "navigate") {
    e.respondWith(caches.match("./index.html").then(r => r || fetch(e.request)));
    return;
  }
  // Everything else: cache-first, then network (and cache it for next time).
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => r))
  );
});

// Push: shows a notification even when the app is closed (needs a push server — see README).
self.addEventListener("push", e => {
  let data = { title: "World Cup 2026", body: "Tap to open the Matchday Board." };
  try { if (e.data) data = Object.assign(data, e.data.json()); } catch (_) {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: data.url || "./"
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = e.notification.data || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(target);
  }));
});
