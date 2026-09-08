/*
 * Offline shell for Cache. Vite fingerprints every asset, so hashed files are
 * safe to serve cache-first forever; navigations go network-first and fall back
 * to the cached shell so the installed app opens with no connection.
 */
const VERSION = 'v1';
const CACHE = `cache-app-${VERSION}`;
const SCOPE = new URL(self.registration.scope);
const SHELL = ['', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'].map(
  (p) => new URL(p, SCOPE).toString(),
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(new URL('index.html', SCOPE).toString(), copy));
          return res;
        })
        .catch(() =>
          caches
            .match(new URL('index.html', SCOPE).toString())
            .then((hit) => hit ?? Response.error()),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
