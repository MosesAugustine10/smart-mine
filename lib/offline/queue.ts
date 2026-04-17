/**
 * Smart Mine — Offline Sync Queue Manager
 * Manages the pending operations queue in IndexedDB.
 */

import { dbPut, dbGetAll, dbDelete, dbCount, STORES } from "./db"

export type QueueOperation = "insert" | "update" | "delete"
export type QueueStatus = "pending" | "syncing" | "failed"

export interface QueueItem {
  id?: number
  tableName: string
  operation: QueueOperation
  payload: Record<string, unknown>
  status: QueueStatus
  retries: number
  createdAt: string
  lastAttempt?: string
  error?: string
  localId: string // client-generated UUID for deduplication
}

/**
 * Add a new operation to the pending queue.
 */
export async function enqueue(
  tableName: string,
  operation: QueueOperation,
  payload: Record<string, unknown>
): Promise<void> {
  const item: QueueItem = {
    tableName,
    operation,
    payload,
    status: "pending",
    retries: 0,
    createdAt: new Date().toISOString(),
    localId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  }
  await dbPut(STORES.PENDING_QUEUE, item)
}

/**
 * Get all items that are pending or failed (eligible for sync).
 */
export async function getPendingItems(): Promise<QueueItem[]> {
  const all = await dbGetAll<QueueItem>(STORES.PENDING_QUEUE)
  return all.filter((item) => item.status === "pending" || item.status === "failed")
}

/**
 * Get total count of all queued items (including failed).
 */
export async function getPendingCount(): Promise<number> {
  const pending = await getPendingItems()
  return pending.length
}

/**
 * Mark an item as syncing (in-progress).
 */
export async function markSyncing(item: QueueItem): Promise<void> {
  await dbPut(STORES.PENDING_QUEUE, {
    ...item,
    status: "syncing",
    lastAttempt: new Date().toISOString(),
  })
}

/**
 * Remove a successfully synced item from the queue.
 */
export async function removeSynced(id: number): Promise<void> {
  await dbDelete(STORES.PENDING_QUEUE, id)
}

/**
 * Mark a failed item with error details for retry.
 */
export async function markFailed(item: QueueItem, error: string): Promise<void> {
  await dbPut(STORES.PENDING_QUEUE, {
    ...item,
    status: "failed",
    retries: item.retries + 1,
    error,
    lastAttempt: new Date().toISOString(),
  })
}

/**
 * Get count of all items in the queue store.
 */
export async function getTotalQueueCount(): Promise<number> {
  return dbCount(STORES.PENDING_QUEUE)
}
