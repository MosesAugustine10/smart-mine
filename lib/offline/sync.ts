/**
 * Smart Mine — Auto-Sync Engine
 * Listens for connectivity changes and syncs the offline queue to Supabase.
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  getPendingItems,
  markSyncing,
  removeSynced,
  markFailed,
  type QueueItem,
} from "./queue"

export type SyncStatus = "idle" | "syncing" | "success" | "error"

export interface SyncResult {
  synced: number
  failed: number
  errors: string[]
}

type SyncStatusListener = (status: SyncStatus, result?: SyncResult) => void
type CountListener = (count: number) => void

const statusListeners: Set<SyncStatusListener> = new Set()
const countListeners: Set<CountListener> = new Set()
let currentSyncStatus: SyncStatus = "idle"
let isSyncing = false

export function onSyncStatusChange(listener: SyncStatusListener): () => void {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

export function onCountChange(listener: CountListener): () => void {
  countListeners.add(listener)
  return () => countListeners.delete(listener)
}

function emitStatus(status: SyncStatus, result?: SyncResult) {
  currentSyncStatus = status
  statusListeners.forEach((l) => l(status, result))
}

export async function broadcastCount() {
  const { getPendingCount } = await import("./queue")
  const count = await getPendingCount()
  countListeners.forEach((l) => l(count))
}

async function syncItem(item: QueueItem): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  await markSyncing(item)

  let error: Error | null = null

  if (item.operation === "insert") {
    const { error: err } = await supabase
      .from(item.tableName)
      .upsert(item.payload as Record<string, unknown>, { onConflict: "id" })
    error = err
  } else if (item.operation === "update") {
    const { id, ...rest } = item.payload as { id: string; [key: string]: unknown }
    const { error: err } = await supabase
      .from(item.tableName)
      .update(rest)
      .eq("id", id)
    error = err
  } else if (item.operation === "delete") {
    const { id } = item.payload as { id: string }
    const { error: err } = await supabase
      .from(item.tableName)
      .delete()
      .eq("id", id)
    error = err
  }

  if (error) {
    await markFailed(item, error.message)
    throw error
  } else {
    await removeSynced(item.id!)
  }
}

/**
 * Main sync function — processes all pending queue items.
 */
export async function syncPendingQueue(): Promise<SyncResult> {
  if (isSyncing) return { synced: 0, failed: 0, errors: [] }
  isSyncing = true
  emitStatus("syncing")

  const result: SyncResult = { synced: 0, failed: 0, errors: [] }

  try {
    const pendingItems = await getPendingItems()

    for (const item of pendingItems) {
      // Skip items that have retried too many times
      if (item.retries >= 5) continue

      try {
        await syncItem(item)
        result.synced++
      } catch (err: unknown) {
        result.failed++
        result.errors.push(
          err instanceof Error ? err.message : "Unknown sync error"
        )
      }
    }

    emitStatus(result.failed > 0 ? "error" : "success", result)
  } catch (err: unknown) {
    emitStatus("error", result)
  } finally {
    isSyncing = false
    await broadcastCount()
  }

  return result
}

/**
 * Initialize the sync engine — registers online/offline event listeners.
 * Call this once on app startup.
 */
export function initSyncEngine(): () => void {
  const handleOnline = async () => {
    if (navigator.onLine) {
      await syncPendingQueue()
    }
  }

  window.addEventListener("online", handleOnline)

  // Also try to sync periodically (every 30 seconds) when online
  const interval = setInterval(async () => {
    if (navigator.onLine) {
      const pending = await getPendingItems()
      if (pending.length > 0) {
        await syncPendingQueue()
      }
    }
  }, 30_000)

  // Initial count broadcast
  broadcastCount()

  return () => {
    window.removeEventListener("online", handleOnline)
    clearInterval(interval)
  }
}
