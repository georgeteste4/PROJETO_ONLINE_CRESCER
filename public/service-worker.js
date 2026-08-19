const CACHE_NAME = 'crescer-static-v3';
const APP_SCOPE = new URL('./', self.registration.scope).href;
const APP_SCOPE_PATH = new URL(APP_SCOPE).pathname;
const SHELL = [
    APP_SCOPE,
    new URL('./index.html', APP_SCOPE).href,
    new URL('./manifest.json', APP_SCOPE).href,
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => undefined));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_SCOPE_PATH)) return;
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
    }).catch(() => caches.match(new URL('./index.html', APP_SCOPE).href))));
});
