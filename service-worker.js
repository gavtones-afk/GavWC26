const CACHE="wc26-v1";
const SHELL=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.pathname.includes("/api/")||u.pathname.includes("/.netlify/functions/")) return; // never cache live data
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{ const cc=r.clone(); caches.open(CACHE).then(ch=>ch.put(e.request,cc)); return r; }).catch(()=>caches.match("./index.html"))));
});
self.addEventListener("push",e=>{ let d={title:"World Cup 2026",body:"Update"}; try{d=e.data.json();}catch(_){} e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:"icons/icon-192.png",badge:"icons/icon-192.png"})); });
self.addEventListener("notificationclick",e=>{ e.notification.close(); e.waitUntil(clients.matchAll({type:"window"}).then(cs=>cs.length?cs[0].focus():clients.openWindow("./index.html"))); });
