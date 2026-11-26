// Service worker mínimo: hace la app instalable y guarda en caché los archivos estáticos.
// Las páginas y los datos siempre se piden a la red (precios y stock cambian).
const CACHE = 'so-estaticos-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/icons/icon-192.png', '/icons/icon-512.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(e.request).then(
        (r) =>
          r ||
          fetch(e.request).then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
            return res;
          }),
      ),
    );
  }
});
