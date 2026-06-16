/**
 * Lightweight in-memory TTL cache used to reduce repeated provider calls.
 *
 * This is intentionally simple (single-process Map). In a multi-instance
 * deployment this would be backed by Redis; the `withCache` API would not change.
 */
import env from '../config/env.js';
import logger from '../utils/logger.js';

export class TTLCache {
  constructor(defaultTtlMs = 30000) {
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map(); // key -> { value, expiresAt }
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  /** Invalidate one key, or all keys with a given prefix (e.g. "aws:"). */
  invalidate(keyOrPrefix) {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(keyOrPrefix)) this.store.delete(key);
    }
  }

  clear() {
    this.store.clear();
  }

  stats() {
    return { size: this.store.size, hits: this.hits, misses: this.misses };
  }
}

// Shared singleton cache for the adapter layer.
export const adapterCache = new TTLCache(env.cache.ttlMs);

/**
 * Memoize an async function result under `key` for the cache TTL.
 * Caching is bypassed when disabled (e.g. in tests).
 */
export async function withCache(key, fn, ttlMs) {
  if (!env.cache.enabled) return fn();

  const cached = adapterCache.get(key);
  if (cached !== undefined) {
    logger.debug?.(`[cache] hit ${key}`);
    return cached;
  }
  const value = await fn();
  adapterCache.set(key, value, ttlMs);
  return value;
}

export default adapterCache;
