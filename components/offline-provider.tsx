"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { enqueue, getPendingCount, type QueueOperation } from "@/lib/offline/queue"
import {
  initSyncEngine,
  syncPendingQueue,
  onSyncStatusChange,
  onCountChange,
  type SyncStatus,
  type SyncResult,
} from "@/lib/offline/sync"

interface OfflineContextValue {
  isOnline: boolean
  pendingCount: number
  syncStatus: SyncStatus
  lastSyncResult: SyncResult | null
  /**
   * Call this instead of a direct Supabase insert/update when you want
   * offline support. If online, writes to Supabase directly. If offline,
   * queues to IndexedDB.
   */
  offlineWrite: (
    tableName: string,
    operation: QueueOperation,
    payload: Record<string, unknown>
  ) => Promise<{ queued: boolean; error?: string }>
  triggerSync: () => Promise<SyncResult>
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    // Set initial online state
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initialize sync engine and register listeners
    const cleanupSync = initSyncEngine()

    const cleanupStatus = onSyncStatusChange((status, result) => {
      setSyncStatus(status)
      if (result) setLastSyncResult(result)
    })

    const cleanupCount = onCountChange((count) => {
      setPendingCount(count)
    })

    // Load initial pending count
    getPendingCount().then(setPendingCount)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      cleanupSync()
      cleanupStatus()
      cleanupCount()
    }
  }, [])

  const offlineWrite = useCallback(
    async (
      tableName: string,
      operation: QueueOperation,
      payload: Record<string, unknown>
    ): Promise<{ queued: boolean; error?: string }> => {
      if (!navigator.onLine) {
        // Queue for later sync
        try {
          await enqueue(tableName, operation, payload)
          const newCount = await getPendingCount()
          setPendingCount(newCount)
          return { queued: true }
        } catch (err: unknown) {
          return {
            queued: false,
            error: err instanceof Error ? err.message : "Failed to queue",
          }
        }
      }
      // When online, caller handles Supabase directly — not queued
      return { queued: false }
    },
    []
  )

  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    return syncPendingQueue()
  }, [])

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        syncStatus,
        lastSyncResult,
        offlineWrite,
        triggerSync,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const ctx = useContext(OfflineContext)
  if (!ctx) {
    throw new Error("useOffline must be used within an OfflineProvider")
  }
  return ctx
}
