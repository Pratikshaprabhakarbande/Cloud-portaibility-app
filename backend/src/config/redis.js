/**
 * Optional Redis client for the adapter cache.
 *
 * Returns a connected ioredis client when REDIS_URL is set and ioredis is
 * installed; otherwise returns null so callers transparently fall back to the
 * in-memory cache. Connection failures disable Redis (never throw to callers).
 */
import env from './env.js';
import logger from '../utils/logger.js';

let clientPromise = null;
let disabled = false;

export async function getRedis() {
  if (disabled || !env.cache.redisUrl) return null;
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(env.cache.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false
      });
      client.on('error', (e) => logger.warn(`[redis] ${e.message}`));
      await client.connect();
      logger.info('[redis] connected (adapter cache backend)');
      return client;
    } catch (err) {
      logger.warn(`[redis] unavailable, using in-memory cache: ${err.message}`);
      disabled = true;
      return null;
    }
  })();

  return clientPromise;
}

export default { getRedis };
