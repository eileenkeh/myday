/* Offline cache — lets the Home Screen app run with no server after first load. */
const CACHE = 'myday-v3';
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      // index.html is the app — this one must succeed for install to count
      await c.add('./index.html');
      // nice-to-haves: never let these block the offline install
      try { await c.add('./'); } catch (err) {}
      try { await c.add('./icon.png'); } catch (err) {}
    }).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          if (res.ok && e.request.method === 'GET') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
    ).catch(() =>
      // last resort: any navigation gets the cached app shell
      e.request.mode === 'navigate' ? caches.match('./index.html') : undefined
    )
  );
});
