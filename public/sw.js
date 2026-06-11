const CACHE_VERSION = 'v2'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const APP_CACHE = `app-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`
const API_CACHE = `api-${CACHE_VERSION}`
const CACHE_PREFIXES = ['static-', 'app-', 'images-', 'api-']
const PLAYED_MATCH_SYNC_TAG = 'played-match-sync'
const LIVE_GAME_NOTIFICATION = 'live-game-notification'
const DRAFT_DB_NAME = 'lolek-match-drafts'
const QUEUE_STORE_NAME = 'played-match-sync-queue'
const META_STORE_NAME = 'metadata'
const PLAYED_MATCH_API_BASE_URL_KEY = 'played-match-api-base-url'

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

function openDraftDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DRAFT_DB_NAME)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
    })
}

async function readQueuedPlayedMatches() {
    const database = await openDraftDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(QUEUE_STORE_NAME, 'readonly')
        const store = transaction.objectStore(QUEUE_STORE_NAME)
        const request = store.getAll()
        request.onerror = () => {
            database.close()
            reject(request.error)
        }
        request.onsuccess = () => {
            database.close()
            resolve(request.result || [])
        }
    })
}

async function loadApiBaseUrl() {
    const database = await openDraftDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(META_STORE_NAME, 'readonly')
        const store = transaction.objectStore(META_STORE_NAME)
        const request = store.get(PLAYED_MATCH_API_BASE_URL_KEY)
        request.onerror = () => {
            database.close()
            reject(request.error)
        }
        request.onsuccess = () => {
            database.close()
            resolve(request.result?.value || '')
        }
    })
}

async function deleteQueuedPlayedMatch(matchId) {
    const database = await openDraftDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(QUEUE_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(QUEUE_STORE_NAME)
        const request = store.delete(matchId)
        request.onerror = () => {
            database.close()
            reject(request.error)
        }
        request.onsuccess = () => {
            database.close()
            resolve()
        }
    })
}

async function markQueuedPlayedMatchFailed(matchId, errorMessage) {
    const database = await openDraftDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(QUEUE_STORE_NAME, 'readwrite')
        const store = transaction.objectStore(QUEUE_STORE_NAME)
        const getRequest = store.get(matchId)
        getRequest.onerror = () => {
            database.close()
            reject(getRequest.error)
        }
        getRequest.onsuccess = () => {
            const queued = getRequest.result
            if (!queued) {
                database.close()
                resolve()
                return
            }
            queued.attempts = (queued.attempts || 0) + 1
            queued.lastError = errorMessage || queued.lastError || null
            const putRequest = store.put(queued)
            putRequest.onerror = () => {
                database.close()
                reject(putRequest.error)
            }
            putRequest.onsuccess = () => {
                database.close()
                resolve()
            }
        }
    })
}

async function flushQueuedPlayedMatchesFromSw() {
    const queuedSaves = await readQueuedPlayedMatches()
    if (!queuedSaves.length) return 0

    const baseUrlRaw = await loadApiBaseUrl()
    const baseUrl = typeof baseUrlRaw === 'string' ? baseUrlRaw.replace(/\/$/, '') : ''
    const endpoint = baseUrl ? `${baseUrl}/played-matches/custom` : '/played-matches/custom'
    let processed = 0

    for (const queuedSave of queuedSaves) {
        const { queuedAt, attempts, lastError, ...payload } = queuedSave
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(`Unexpected sync response: ${response.status}`)
            }

            await deleteQueuedPlayedMatch(queuedSave.matchId)
            processed += 1
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to sync played match'
            await markQueuedPlayedMatchFailed(queuedSave.matchId, message)
            break
        }
    }

    return processed
}

self.addEventListener('sync', (event) => {
    if (event.tag !== PLAYED_MATCH_SYNC_TAG) {
        return
    }

    event.waitUntil(flushQueuedPlayedMatchesFromSw())
})

self.addEventListener('message', (event) => {
    const data = event.data || {}
    if (data.type !== 'LIVE_GAME_NOTIFICATION') {
        return
    }

    if (!('showNotification' in self.registration) || Notification.permission !== 'granted') {
        return
    }

    const title = data.title || 'LoLek'
    const body = data.body || 'Live game update'
    const tag = data.tag || LIVE_GAME_NOTIFICATION
    const url = data.url || '/'

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            tag,
            data: { url },
            icon: '/manifest.json',
        }),
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const targetUrl = event.notification.data?.url || '/'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus()
                    return client.navigate?.(targetUrl) || Promise.resolve()
                }
            }

            return clients.openWindow(targetUrl)
        }),
    )
})

self.addEventListener('message', async (event) => {
    if (event.data?.type === 'FLUSH_PLAYED_MATCH_QUEUE') {
        event.waitUntil(flushQueuedPlayedMatchesFromSw())
        return
    }

    if (event.data?.type === 'PRECACHE_IMAGES') {
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
    }
})
