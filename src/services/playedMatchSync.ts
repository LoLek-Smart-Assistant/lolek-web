import axiosInstance from '../config/axiosConfig'
import type { SavePlayedMatchRequest } from './playedMatchService'
import {
  deleteQueuedPlayedMatchSave,
  loadQueuedPlayedMatchSaves,
  markQueuedPlayedMatchSaveFailed,
  savePlayedMatchApiBaseUrl,
  saveQueuedPlayedMatchSave,
} from './matchDraftStorage'

const PLAYED_MATCH_SYNC_TAG = 'played-match-sync'
let onlineListenerAttached = false

function getApiBaseUrl() {
  return (axiosInstance.defaults.baseURL as string | undefined)?.replace(/\/$/, '') ?? ''
}

async function persistApiBaseUrl() {
  const baseUrl = getApiBaseUrl()

  if (baseUrl) {
    await savePlayedMatchApiBaseUrl(baseUrl)
  }

  return baseUrl
}

export async function setupPlayedMatchBackgroundSync() {
  await persistApiBaseUrl()

  if (typeof window !== 'undefined' && !onlineListenerAttached) {
    onlineListenerAttached = true
    window.addEventListener('online', () => {
      void flushQueuedPlayedMatchSaves().catch((error) => {
        console.error('Failed to flush queued played matches on reconnect:', error)
      })
    })
  }
}

export async function queuePlayedMatchSaveForSync(payload: SavePlayedMatchRequest) {
  const queuedSave = await saveQueuedPlayedMatchSave(payload)
  await persistApiBaseUrl()
  void registerPlayedMatchSync()
  return queuedSave
}

export async function registerPlayedMatchSync() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.ready
  const syncManager = (serviceWorkerRegistration as ServiceWorkerRegistration & { sync?: SyncManager }).sync

  if (!syncManager?.register) {
    return false
  }

  try {
    await syncManager.register(PLAYED_MATCH_SYNC_TAG)
    return true
  } catch (error) {
    console.warn('Background sync registration failed:', error)
    return false
  }
}

export async function flushQueuedPlayedMatchSaves() {
  const queuedSaves = await loadQueuedPlayedMatchSaves()
  let processedCount = 0

  for (const queuedSave of queuedSaves) {
    const { queuedAt, attempts, lastError, ...payload } = queuedSave

    try {
      const response = await axiosInstance.post('/played-matches', payload)

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Unexpected sync response: ${response.status}`)
      }

      await deleteQueuedPlayedMatchSave(queuedSave.matchId)
      processedCount += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync played match'
      await markQueuedPlayedMatchSaveFailed(queuedSave.matchId, message)
      break
    }
  }

  return processedCount
}

export async function requestPlayedMatchQueueFlush() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'FLUSH_PLAYED_MATCH_QUEUE' })
    return
  }

  await flushQueuedPlayedMatchSaves()
}
