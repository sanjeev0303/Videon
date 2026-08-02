import { LRUCache } from 'lru-cache';
import { LRU_SOFT_TTL_MS, type CachedKey } from '../config';

export const localCache = new LRUCache<string, CachedKey>({
    max: 100_000, 
    ttl: LRU_SOFT_TTL_MS
});
