/**
 * Smart Mine — IndexedDB Offline Storage Layer
 * Uses the native browser IndexedDB API (no external dependencies).
 * Stores: pending_queue | offline_cache
 */

const DB_NAME = "smart_mine_pro_offline"
const DB_VERSION = 1

export const STORES = {
  PENDING_QUEUE: "pending_queue",
  OFFLINE_CACHE: "offline_cache",
} as const

let db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Pending sync queue
      if (!database.objectStoreNames.contains(STORES.PENDING_QUEUE)) {
        const queueStore = database.createObjectStore(STORES.PENDING_QUEUE, {
          keyPath: "id",
          autoIncrement: true,
        })
        queueStore.createIndex("by_table", "tableName", { unique: false })
        queueStore.createIndex("by_status", "status", { unique: false })
        queueStore.createIndex("by_created", "createdAt", { unique: false })
      }

      // Offline read cache
      if (!database.objectStoreNames.contains(STORES.OFFLINE_CACHE)) {
        const cacheStore = database.createObjectStore(STORES.OFFLINE_CACHE, {
          keyPath: "cacheKey",
        })
        cacheStore.createIndex("by_table", "tableName", { unique: false })
        cacheStore.createIndex("by_expiry", "expiresAt", { unique: false })
      }
    }

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

export async function dbGet<T>(
  storeName: string,
  key: IDBValidKey
): Promise<T | undefined> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).get(key)
    request.onsuccess = () => resolve(request.result as T)
    request.onerror = () => reject(request.error)
  })
}

export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

export async function dbPut(
  storeName: string,
  value: object
): Promise<IDBValidKey> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, "readwrite")
    const request = tx.objectStore(storeName).put(value)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function dbDelete(
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, "readwrite")
    const request = tx.objectStore(storeName).delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function dbClear(storeName: string): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, "readwrite")
    const request = tx.objectStore(storeName).clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function dbCount(storeName: string): Promise<number> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
