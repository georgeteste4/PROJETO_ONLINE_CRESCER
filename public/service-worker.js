const CACHE_NAME = 'crescer-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return; // never cache API
    event.respondWith(
        caches.match(req).then((cached) => {
            return (
                cached ||
                fetch(req)
                    .then((res) => {
                        if (res && res.status === 200 && res.type === 'basic') {
                            const clone = res.clone();
                            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
                        }
                        return res;
                    })
                    .catch(() => caches.match('/index.html'))
            );
        })
    );
});
