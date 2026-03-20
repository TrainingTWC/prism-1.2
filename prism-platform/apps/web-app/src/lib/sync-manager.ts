'use client';

/**
 * SyncManager — processes the IndexedDB sync queue when the device
 * comes back online. Call `startSyncManager()` once at app startup.
 */

import {
  getSyncQueue,
  removeFromSyncQueue,
  markDraftSynced,
  onOnlineChange,
  isOnline,
} from './offline-store';
import { syncOfflineSubmission } from './submission-api';

let running = false;

async function processQueue() {
  if (running) return;
  running = true;

  try {
    const queue = await getSyncQueue();

    for (const item of queue) {
      try {
        await syncOfflineSubmission(item);
        await removeFromSyncQueue(item.id);
        await markDraftSynced(item.id);
        console.log(`[SyncManager] Synced submission ${item.id}`);
      } catch (err) {
        console.error(`[SyncManager] Failed to sync ${item.id}`, err);
        // Leave in queue for retry
      }
    }
  } finally {
    running = false;
  }
}

export function startSyncManager() {
  // Process immediately if online
  if (isOnline()) {
    processQueue();
  }

  // Process when coming back online
  const unsubscribe = onOnlineChange((online) => {
    if (online) {
      processQueue();
    }
  });

  // Also check periodically (every 60s)
  const interval = setInterval(() => {
    if (isOnline()) processQueue();
  }, 60_000);

  return () => {
    unsubscribe();
    clearInterval(interval);
  };
}
