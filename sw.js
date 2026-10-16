/* AI Arcade service worker: keeps every file on the iPad so the games work with no wifi.
   When you change a file, add 1 to VERSION so iPads get the new files. Add new game files to FILES. */
const VERSION = "arcade-v0.6";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest", "./css/app.css", "./js/app.js",
  "./games/yours-or-mine.js", "./games/mind-the-gap-data.js", "./games/mind-the-gap.js", "./games/prompt-golf-data.js", "./games/prompt-golf.js",
  "./img/dh-logo.png", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png",
  "./fonts/mulish-latin.woff2", "./fonts/inter-latin.woff2",
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// cache first, then refresh the cache in the background when there is a connection
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(VERSION).then((c) => c.match(e.request, { ignoreSearch: true }).then((hit) => {
    const net = fetch(e.request).then((r) => { if (r.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
