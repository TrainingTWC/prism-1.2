// ──────────────────────────────────────────
// IndexedDB Offline Store for submission drafts
// ──────────────────────────────────────────

import type { OfflineDraft, ResponseInput } from '../types/checklist';

const DB_NAME = 'prism-offline';
const DB_VERSION = 1;
const DRAFTS_STORE = 'drafts';
const QUEUE_STORE = 'sync-queue';

// ── Open database ──

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const store = db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
        store.createIndex('programId', 'programId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Generic helpers ──

async function txGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function txPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function txDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function txGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

// ════════════════════════════════════════════════════════════════
//  Public API — Drafts
// ════════════════════════════════════════════════════════════════

export async function saveDraftOffline(draft: OfflineDraft): Promise<void> {
  await txPut(DRAFTS_STORE, { ...draft, updatedAt: new Date().toISOString() });
}

export async function getDraft(id: string): Promise<OfflineDraft | undefined> {
  return txGet<OfflineDraft>(DRAFTS_STORE, id);
}

export async function getAllDrafts(): Promise<OfflineDraft[]> {
  return txGetAll<OfflineDraft>(DRAFTS_STORE);
}

export async function getUnsyncedDrafts(): Promise<OfflineDraft[]> {
  const all = await getAllDrafts();
  return all.filter((d) => !d.synced);
}

export async function deleteDraft(id: string): Promise<void> {
  await txDelete(DRAFTS_STORE, id);
}

export async function markDraftSynced(id: string): Promise<void> {
  const draft = await getDraft(id);
  if (draft) {
    await txPut(DRAFTS_STORE, { ...draft, synced: true });
  }
}

// ════════════════════════════════════════════════════════════════
//  Public API — Sync Queue
// ════════════════════════════════════════════════════════════════

export interface SyncQueueItem {
  id: string;
  programId: string;
  employeeId: string;
  storeId: string;
  responses: ResponseInput[];
  geoLat?: number;
  geoLng?: number;
  deviceId: string;
  startedAt: string;
  submittedAt: string;
}

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  await txPut(QUEUE_STORE, item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return txGetAll<SyncQueueItem>(QUEUE_STORE);
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  await txDelete(QUEUE_STORE, id);
}

// ════════════════════════════════════════════════════════════════
//  Online / Offline detection
// ════════════════════════════════════════════════════════════════

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function onOnlineChange(callback: (online: boolean) => void): () => void {
  const onOnline = () => callback(true);
  const onOffline = () => callback(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
