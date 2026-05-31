const CACHE_VERSION = 'v2'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const APP_CACHE = `app-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`
const API_CACHE = `api-${CACHE_VERSION}`
const CACHE_PREFIXES = ['static-', 'app-', 'images-', 'api-']

const STATIC_ASSETS = [
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
                        (key) => {
                            const managed = CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))
                            if (!managed) return false
                            return ![STATIC_CACHE, APP_CACHE, IMAGE_CACHE, API_CACHE].includes(key)
                        },
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
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone()
                        caches.open(API_CACHE).then((cache) => {
                            cache.put(request, clone)
                        })
                    }
                    return response
                })
                .catch(async () => {
                    const cache = await caches.open(API_CACHE)
                    return cache.match(request)
                }),
        )
        return
    }

    // Images -> cache first
    if (
        request.destination === 'image'
    ) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then((cache) => cache.match(request)).then((cached) => {
                if (cached) return cached

                return fetch(request).then((response) => {
                    const clone = response.clone()

                    caches.open(IMAGE_CACHE).then((cache) => {
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
        caches.open(APP_CACHE).then((cache) =>
            cache.match(request).then((cached) => {
            const networkFetch = fetch(request)
                .then((response) => {
                    const clone = response.clone()

                    caches.open(APP_CACHE).then((cache) => {
                        cache.put(request, clone)
                    })

                    return response
                })

            return cached || networkFetch
            }),
        ),
    )
})

self.addEventListener('message', async (event) => {
    if (event.data?.type !== 'PRECACHE_IMAGES') {
        return
    }

    const cache = await caches.open(IMAGE_CACHE)
    const urls = Array.isArray(event.data.urls) ? event.data.urls : []

    await Promise.allSettled(
        urls.map(async (url) => {
            try {
                const existing = await cache.match(url)
                if (existing) {
                    return
                }

                const response = await fetch(url)
                if (response.ok) {
                    await cache.put(url, response.clone())
                }
            } catch (error) {
                console.error(`Failed to precache ${url}:`, error)
            }
        }),
    )
})
