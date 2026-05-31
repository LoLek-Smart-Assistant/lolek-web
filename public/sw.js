const CACHE_NAME = 'worker.js'

const ASSETS = [
    '/',
    '/manifest.json',
    '../index.html',
];

self.addEventListener('install', (event) => {
    self.skipWaiting()

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS)
        }),
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter(
                        (key) =>
                            key !== CACHE_NAME &&
                            key !== STATIC_CACHE,
                    )
                    .map((key) => caches.delete(key)),
            ),
        ),
    )

    self.clients.claim()
})

self.addEventListener('fetch', (event) => {
    const { request } = event

    // Only cache GET requests
    if (request.method !== 'GET') {
        return
    }

    const url = new URL(request.url)

    // API requests -> network first
    if (
        url.pathname.startsWith('/api') ||
        url.hostname.includes('riotgames')
    ) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request)),
        )
        return
    }

    // Images -> cache first
    if (
        request.destination === 'image'
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached

                return fetch(request).then((response) => {
                    const clone = response.clone()

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone)
                    })

                    return response
                })
            }),
        )
        return
    }

    // App shell -> stale while revalidate
    event.respondWith(
        caches.match(request).then((cached) => {
            const networkFetch = fetch(request)
                .then((response) => {
                    const clone = response.clone()

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone)
                    })

                    return response
                })

            return cached || networkFetch
        }),
    )
})