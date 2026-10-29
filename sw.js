// NERIC — Service Worker (نسخة 202610290823)
const CACHE = 'neric-202610290823';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'badge-96.png'];
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
/* ---------- إشعارات الدردشة ---------- */
const IOS = /iPhone|iPad|iPod|Macintosh/.test(self.navigator.userAgent);
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'NERIC', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    const tag = d.conv ? 'chat-' + d.conv : 'neric-' + (d.id || Date.now());
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    wins.forEach(w => w.postMessage({ type: 'push', conv: d.conv || '', id: d.id || '', title: d.title || '', line: d.line || d.body || '' }));
    // التطبيق مفتوح قدامك: الدردشة بتتحدث لوحدها (الآيفون لازم يظهر إشعار في كل الأحوال)
    if (!IOS && wins.some(w => w.visibilityState === 'visible' && w.focused)) return;
    let lines = [];
    if (d.conv) { try { const old = await self.registration.getNotifications({ tag }); if (old[0] && old[0].data && old[0].data.lines) lines = old[0].data.lines; } catch (x) {} }
    lines = lines.concat([d.line || d.body || '']).slice(-5);
    await self.registration.showNotification(d.title || 'NERIC', {
      body: lines.length > 1 ? lines.join('\n') : (d.body || ''), tag, renotify: true,
      icon: 'icon-192.png', badge: 'badge-96.png', dir: 'rtl', lang: 'ar', vibrate: [90, 50, 90], timestamp: Date.now(),
      data: { conv: d.conv || '', lines }
    });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const conv = (e.notification.data || {}).conv || '';
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) { try { await w.focus(); w.postMessage({ type: 'openChat', conv }); return; } catch (x) {} }
    await self.clients.openWindow('./?chat=' + encodeURIComponent(conv) + '#chat');
  })());
});
