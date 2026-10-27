// NERIC — Service Worker (نسخة 202610272013)
const CACHE = 'neric-202610272013';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // طلبات السيرفر (POST) دايمًا على النت — مفيش كاش للبيانات
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // الخطوط وغيرها: زي ما هي
  if (url.pathname.endsWith('config.js')) return;         // رابط السيرفر: دايمًا أحدث نسخة
  // الصفحة: من النت الأول (علشان التحديثات توصل)، ولو مفيش نت من الكاش
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(m => m || fetch(req)));
});
