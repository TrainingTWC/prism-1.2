// ──────────────────────────────────────────────────────────────
// Simple In-Memory TTL Cache
// ──────────────────────────────────────────────────────────────
// Eliminates repeated DB round-trips to remote Supabase.
// Default TTL: 3 minutes. Safe because dashboard/store/employee
// data is updated at most every few minutes.
// ──────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Get a value from cache, or compute it if missing/expired.
 * Deduplicates concurrent calls to the same key (singleflight).
 */
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  // Check cache
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }

  // Singleflight: if another caller is already computing this key, wait for it
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().then((data) => {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}

/** Invalidate a specific key or all keys matching a prefix */
export function invalidate(keyOrPrefix: string) {
  if (store.has(keyOrPrefix)) {
    store.delete(keyOrPrefix);
    return;
  }
  // Prefix invalidation
  for (const k of store.keys()) {
    if (k.startsWith(keyOrPrefix)) store.delete(k);
  }
}

/** Clear the entire cache */
export function clearCache() {
  store.clear();
}

/** Get cache stats for debugging */
export function cacheStats() {
  let active = 0;
  let expired = 0;
  const now = Date.now();
  for (const entry of store.values()) {
    if (entry.expiresAt > now) active++;
    else expired++;
  }
  return { total: store.size, active, expired };
}
