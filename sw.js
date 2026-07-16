/* श्रुतधारा service worker — offline शास्त्र-भंडार.
   Shell + data precached; pages/PDFs cached as visited (stale-while-revalidate). */
const VERSION = '__BUILD_VERSION__';
const CACHE = 'shrutdhara-' + VERSION;
const PRECACHE = [
  './', 'index.html', 'kaal.html', 'granths.html', 'acharya.html', 'bhattarak.html',
  'sources.html', 'about.html',
  'css/style.css', 'css/print.css', 'fonts/fonts.css',
  'js/app.js', 'js/i18n.js', 'js/translit.js', 'js/reader.js',
  'data/granths-90.json', 'data/acharyas-420.json', 'data/bhattarak-172.json',
  'assets/favicon.svg', 'assets/favicon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.startsWith('shrutdhara-') && k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then((res) => {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
