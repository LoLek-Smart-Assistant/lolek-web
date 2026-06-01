import type { SavePlayedMatchRequest } from './playedMatchService'

const DB_NAME = 'lolek-match-drafts'
const DRAFT_STORE_NAME = 'drafts'
const QUEUE_STORE_NAME = 'played-match-sync-queue'
const META_STORE_NAME = 'metadata'
const DB_VERSION = 2
const PLAYED_MATCH_API_BASE_URL_KEY = 'played-match-api-base-url'

export type StoredDraft = SavePlayedMatchRequest & {
  draftId: string
  savedAt: string
}

export type QueuedPlayedMatchSave = SavePlayedMatchRequest & {
  matchId: string
  queuedAt: string
  attempts: number
  lastError?: string | null
}

type StoredMetadata = {
  key: string
  value: string
  updatedAt: string
}

function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        database.createObjectStore(DRAFT_STORE_NAME, { keyPath: 'draftId' })
      }
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

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => void,
): Promise<T> {
  const database = await openDraftDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)

    transaction.oncomplete = () => {
      database.close()
      resolve(undefined as T)
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error)
    }

    handler(store)
  })
}

async function readFromStore<T>(storeName: string, requestFactory: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDraftDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = requestFactory(store)

    request.onsuccess = () => {
      database.close()
      resolve(request.result)
    }
    request.onerror = () => {
      database.close()
      reject(request.error)
    }
  })
}

export async function loadPlayedMatchDraft(draftId: string): Promise<StoredDraft | null> {
  return readFromStore<StoredDraft | null>(DRAFT_STORE_NAME, (store) => store.get(draftId)).then((draft) => draft ?? null)
}

export async function savePlayedMatchDraft(draft: StoredDraft) {
  await withStore<void>(DRAFT_STORE_NAME, 'readwrite', (store) => {
    store.put(draft)
  })
}

export async function deletePlayedMatchDraft(draftId: string) {
  await withStore<void>(DRAFT_STORE_NAME, 'readwrite', (store) => {
    store.delete(draftId)
  })
}

export function createStoredDraft(payload: SavePlayedMatchRequest, draftId = payload.matchId ?? crypto.randomUUID()): StoredDraft {
  return {
    ...payload,
    matchId: payload.matchId ?? draftId,
    draftId,
    savedAt: new Date().toISOString(),
  }
}

export async function saveQueuedPlayedMatchSave(payload: SavePlayedMatchRequest): Promise<QueuedPlayedMatchSave> {
  const queuedSave: QueuedPlayedMatchSave = {
    ...payload,
    matchId: payload.matchId ?? crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  }

  await withStore<void>(QUEUE_STORE_NAME, 'readwrite', (store) => {
    store.put(queuedSave)
  })

  return queuedSave
}

export async function loadQueuedPlayedMatchSaves(): Promise<QueuedPlayedMatchSave[]> {
  return readFromStore<QueuedPlayedMatchSave[]>(QUEUE_STORE_NAME, (store) => store.getAll()).then((entries) => entries ?? [])
}

export async function deleteQueuedPlayedMatchSave(matchId: string) {
  await withStore<void>(QUEUE_STORE_NAME, 'readwrite', (store) => {
    store.delete(matchId)
  })
}

export async function markQueuedPlayedMatchSaveFailed(matchId: string, errorMessage?: string) {
  const queuedSave = await readFromStore<QueuedPlayedMatchSave | undefined>(QUEUE_STORE_NAME, (store) => store.get(matchId))

  if (!queuedSave) {
    return
  }

  await withStore<void>(QUEUE_STORE_NAME, 'readwrite', (store) => {
    store.put({
      ...queuedSave,
      attempts: queuedSave.attempts + 1,
      lastError: errorMessage ?? queuedSave.lastError ?? null,
    })
  })
}

export async function savePlayedMatchApiBaseUrl(baseUrl: string) {
  const metadata: StoredMetadata = {
    key: PLAYED_MATCH_API_BASE_URL_KEY,
    value: baseUrl,
    updatedAt: new Date().toISOString(),
  }

  await withStore<void>(META_STORE_NAME, 'readwrite', (store) => {
    store.put(metadata)
  })
}

export async function loadPlayedMatchApiBaseUrl(): Promise<string | null> {
  const metadata = await readFromStore<StoredMetadata | undefined>(META_STORE_NAME, (store) => store.get(PLAYED_MATCH_API_BASE_URL_KEY))

  return metadata?.value ?? null
}