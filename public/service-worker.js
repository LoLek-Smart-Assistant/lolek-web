const DB_NAME = 'lolek-match-drafts'
const QUEUE_STORE_NAME = 'played-match-sync-queue'
const META_STORE_NAME = 'metadata'
const API_BASE_URL_KEY = 'played-match-api-base-url'
const PLAYED_MATCH_SYNC_TAG = 'played-match-sync'
const DB_VERSION = 2

function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		request.onupgradeneeded = () => {
			const database = request.result

			if (!database.objectStoreNames.contains(QUEUE_STORE_NAME)) {
				database.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'matchId' })
			}

			if (!database.objectStoreNames.contains(META_STORE_NAME)) {
				database.createObjectStore(META_STORE_NAME, { keyPath: 'key' })
			}
		}

		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)
	})
}

async function readRecord(storeName, key) {
	const database = await openDatabase()

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(storeName, 'readonly')
		const store = transaction.objectStore(storeName)
		const request = store.get(key)

		request.onsuccess = () => {
			database.close()
			resolve(request.result ?? null)
		}

		request.onerror = () => {
			database.close()
			reject(request.error)
		}
	})
}

async function readAllQueueEntries() {
	const database = await openDatabase()

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(QUEUE_STORE_NAME, 'readonly')
		const store = transaction.objectStore(QUEUE_STORE_NAME)
		const request = store.getAll()

		request.onsuccess = () => {
			database.close()
			resolve(request.result ?? [])
		}

		request.onerror = () => {
			database.close()
			reject(request.error)
		}
	})
}

async function writeRecord(storeName, value) {
	const database = await openDatabase()

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(storeName, 'readwrite')
		const store = transaction.objectStore(storeName)
		store.put(value)

		transaction.oncomplete = () => {
			database.close()
			resolve()
		}

		transaction.onerror = () => {
			database.close()
			reject(transaction.error)
		}
	})
}

async function deleteQueueEntry(matchId) {
	const database = await openDatabase()

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(QUEUE_STORE_NAME, 'readwrite')
		const store = transaction.objectStore(QUEUE_STORE_NAME)
		store.delete(matchId)

		transaction.oncomplete = () => {
			database.close()
			resolve()
		}

		transaction.onerror = () => {
			database.close()
			reject(transaction.error)
		}
	})
}

async function markQueueEntryFailed(matchId, errorMessage) {
	const queuedEntry = await readRecord(QUEUE_STORE_NAME, matchId)

	if (!queuedEntry) {
		return
	}

	await writeRecord(QUEUE_STORE_NAME, {
		...queuedEntry,
		attempts: (queuedEntry.attempts ?? 0) + 1,
		lastError: errorMessage || queuedEntry.lastError || null,
	})
}

async function getApiBaseUrl() {
	const metadata = await readRecord(META_STORE_NAME, API_BASE_URL_KEY)
	return (metadata && metadata.value) || self.location.origin
}

function buildRequestBody(queueEntry) {
	const { queuedAt, attempts, lastError, ...payload } = queueEntry
	return payload
}

async function notifyClients(message) {
	const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

	for (const client of windowClients) {
		client.postMessage(message)
	}
}

async function flushQueuedPlayedMatches() {
	const queuedEntries = await readAllQueueEntries()
	const apiBaseUrl = await getApiBaseUrl()
	let processedCount = 0

	for (const queuedEntry of queuedEntries) {
		try {
			const response = await fetch(new URL('/played-matches', apiBaseUrl).toString(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(buildRequestBody(queuedEntry)),
			})

			if (!response.ok) {
				throw new Error(`Unexpected sync response: ${response.status}`)
			}

			await deleteQueueEntry(queuedEntry.matchId)
			processedCount += 1
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to sync played match'
			await markQueueEntryFailed(queuedEntry.matchId, message)
			break
		}
	}

	await notifyClients({
		type: 'PLAYED_MATCH_QUEUE_FLUSHED',
		processedCount,
		remainingCount: Math.max(0, queuedEntries.length - processedCount),
	})

	return processedCount
}

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener('sync', (event) => {
	if (event.tag === PLAYED_MATCH_SYNC_TAG) {
		event.waitUntil(flushQueuedPlayedMatches())
	}
})

self.addEventListener('message', (event) => {
	const data = event.data || {}

	if (data.type === 'FLUSH_PLAYED_MATCH_QUEUE') {
		event.waitUntil(flushQueuedPlayedMatches())
	}

	if (data.type === 'SET_PLAYED_MATCH_API_BASE_URL' && typeof data.baseUrl === 'string') {
		event.waitUntil(
			writeRecord(META_STORE_NAME, {
				key: API_BASE_URL_KEY,
				value: data.baseUrl,
				updatedAt: new Date().toISOString(),
			}),
		)
	}
})
