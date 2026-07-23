/* श्रुतधारा service worker — offline शास्त्र-भंडार.
   Strategy per type:
   - HTML navigations: NETWORK-FIRST (fresh on every visit when online; cache
     only as offline fallback). This is what kills the "stale content after
     deploy" symptom — the old code served cached HTML first.
   - CSS/JS/JSON/fonts/images: stale-while-revalidate in the versioned shell cache.
   - audio/*.mp3: cache-first in a SEPARATE, version-INDEPENDENT cache that is
     never wiped on deploy, with 206 Partial-Content responses skipped (cache.put
     throws on 206). Keeps recitation offline without re-downloading on every deploy. */
const VERSION = '__BUILD_VERSION__';
const SHELL = 'shrutdhara-shell-' + VERSION;
const AUDIO = 'shrutdhara-audio-v1';   // stable across deploys on purpose
const PRECACHE = [
  './', 'index.html', 'kaal.html', 'granths.html', 'acharya.html', 'bhattarak.html',
  'sources.html', 'about.html',
  'css/style.css', 'css/print.css', 'fonts/fonts.css',
  'js/app.js', 'js/i18n.js', 'js/translit.js', 'js/reader.js',
  'data/granths-90.json', 'data/acharyas-420.json', 'data/bhattarak-172.json',
  'assets/favicon.svg', 'assets/favicon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys
      .filter((k) => k.startsWith('shrutdhara-shell-') && k !== SHELL)  // wipe old shells only; keep AUDIO
      .map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

const isHTML = (req, url) => req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html') ||
  url.pathname.endsWith('.html') || url.pathname.endsWith('/');

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // audio: cache-first, own stable cache, never store partial (206) responses
  if (url.pathname.includes('/audio/')) {
    e.respondWith((async () => {
      const cache = await caches.open(AUDIO);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.status === 200) cache.put(req, res.clone());
        return res;
      } catch {
        return hit || Response.error();
      }
    })());
    return;
  }

  // HTML: network-first (fresh when online), cache fallback offline
  if (isHTML(req, url)) {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) ||
               (await cache.match('index.html')) || Response.error();
      }
    })());
    return;
  }

  // everything else (css/js/json/fonts/img): stale-while-revalidate
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res && res.ok && res.status === 200) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
