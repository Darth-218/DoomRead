// Minimal promise-based IndexedDB wrapper (no external deps, per §10 privacy).
let _db: IDBDatabase | null = null

const DB_NAME = 'doomread'
const DB_VERSION = 1

const STORES = ['documents', 'progress', 'bookmarks', 'stats', 'settings', 'pdfs'] as const

export type StoreName = (typeof STORES)[number]

function keyPathFor(name: StoreName): string {
  switch (name) {
    case 'documents':
      return 'id'
    case 'progress':
      return 'documentId'
    case 'bookmarks':
      return 'key'
    case 'stats':
      return 'date'
    case 'settings':
      return 'id'
    case 'pdfs':
      return 'id'
  }
}

function createStores(db: IDBDatabase): void {
  for (const name of STORES) {
    if (!db.objectStoreNames.contains(name)) {
      db.createObjectStore(name, { keyPath: keyPathFor(name) })
    }
  }
}

export function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db)
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => createStores(req.result)
    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error)
  })
}

function store(db: IDBDatabase, name: StoreName, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(name, mode).objectStore(name)
}

export function get<T>(name: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = store(db(), name, 'readonly').get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export function getAll<T>(name: StoreName): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = store(db(), name, 'readonly').getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

export function put<T>(name: StoreName, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store(db(), name, 'readwrite').put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export function del(name: StoreName, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store(db(), name, 'readwrite').delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function db(): IDBDatabase {
  if (!_db) throw new Error('IndexedDB not open yet')
  return _db
}
