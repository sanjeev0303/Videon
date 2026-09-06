import { LRUCache } from 'lru-cache';
import { VERSION, REDIS_HARD_TTL, LRU_SOFT_TTL_MS } from '../config';
import { redisClient } from './redis';

// Response cache (soft tier): in-memory LRU holding serialized JSON bodies.
// Hard tier: Redis with the route-provided TTL (defaults to REDIS_HARD_TTL).
// Keys are scoped per user so one tenant's data is never served to another.
const RESPONSE_KEY_PREFIX = `vmx:resp:${VERSION}`;
const RESPONSE_INDEX_PREFIX = `vmx:resp:index:${VERSION}`;

const responseLocalCache = new LRUCache<string, string>({
  max: 50_000,
  ttl: LRU_SOFT_TTL_MS,
});

const responseKey = (userId: string, path: string): string =>
  `${RESPONSE_KEY_PREFIX}:${userId}:${path}`;

const userIndexKey = (userId: string): string => `${RESPONSE_INDEX_PREFIX}:${userId}`;

/**
 * Reads a cached response body for (user, path). Checks the in-memory LRU
 * first, then the Redis hard tier; Redis hits are written back into the LRU.
 * Returns null on any cache miss or Redis failure (read path must degrade to
 * a live fetch, never crash).
 */
export const getResponseCache = async (userId: string, path: string): Promise<string | null> => {
  const key = responseKey(userId, path);

  const local = responseLocalCache.get(key);
  if (local !== undefined) {
    return local;
  }

  try {
    const redisValue = await redisClient.get(key);
    if (redisValue !== null) {
      responseLocalCache.set(key, redisValue);
      return redisValue;
    }
  } catch (error) {
    console.error('Redis get failed for response cache, degrading to miss', error);
  }

  return null;
};

/**
 * Writes a response body into both cache tiers and registers the key in the
 * per-user index (a Redis SET) so invalidation can purge exactly the keys it
 * knows about, even for in-memory state rebuilt after a restart.
 */
export const setResponseCache = async (
  userId: string,
  path: string,
  body: unknown,
  ttlSec: number = REDIS_HARD_TTL,
): Promise<void> => {
  const key = responseKey(userId, path);
  const serialized = JSON.stringify(body);

  responseLocalCache.set(key, serialized, { ttl: ttlSec * 1000 });

  try {
    const pipeline = redisClient.pipeline();
    pipeline.setex(key, ttlSec, serialized);
    pipeline.sadd(userIndexKey(userId), key);
    await pipeline.exec();
  } catch (error) {
    console.error('Redis set failed for response cache, continuing with in-memory only', error);
  }
};

/**
 * Purges the cached responses of one user. With an optional pathPrefix, only
 * keys containing that substring are removed (e.g. the /upload metadata paths
 * when a video changes); without it, the whole user's response cache is wiped.
 */
export const invalidateResponseCache = async (userId: string, pathPrefix?: string): Promise<void> => {
  const indexKey = userIndexKey(userId);

  let keys: string[];
  try {
    keys = await redisClient.smembers(indexKey);
  } catch (error) {
    console.error('Redis smembers failed for response cache invalidation', error);
    return;
  }

  const targets = pathPrefix ? keys.filter((key) => key.includes(pathPrefix)) : keys;
  if (targets.length === 0) {
    return;
  }

  for (const key of targets) {
    responseLocalCache.delete(key);
  }

  try {
    const pipeline = redisClient.pipeline();
    for (const key of targets) {
      pipeline.srem(indexKey, key);
      pipeline.del(key);
    }
    await pipeline.exec();
  } catch (error) {
    console.error('Redis del failed for response cache invalidation', error);
  }
};