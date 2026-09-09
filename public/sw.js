const CACHE_NAME = 'gk-whizwheel-ops-v1';
const STATIC_ASSETS = [
    '/favicon.ico',
    '/manifest.json',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests and http/https schemes
    if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    // Skip API and mutations
    if (url.pathname.startsWith('/api/') || url.pathname.includes('/livewire/')) {
        return;
    }

    // Navigation requests (HTML pages) - Network first, fall back to cached page if offline
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/admin/dashboard');
                    });
                })
        );
        return;
    }

    // Static assets (Vite build assets, images, fonts) - Stale-while-revalidate
    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/images/') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.png')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                }).catch(() => null);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Default: try network, fallback to cache
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
