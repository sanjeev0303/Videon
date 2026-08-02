export const VERSION = "v1";
export const REDIS_HARD_TTL = 10 * 60;
export const LRU_SOFT_TTL_MS = 5 * 60 * 1000;
export const LAST_USED_DEBOUNCE_SEC = 60;
export const LAST_USED_HASH = `vmx:api_key:last_used:${VERSION}`;
export const DEFAULT_PLAYLIST_LIMIT = 10;

export const PLAN_LRU_TTL_MS = 5 * 60 * 1_000;
export const PLAN_REDIS_TTL_SEC = 6 * 60;

export const planRedisKey = (userId: string) => `vmx:plan:${VERSION}:${userId}`;

export const usageRedisKey = (userId: string) =>
  `vmx:usage:${VERSION}:${userId}`;

export const hardLockRedisKey = (userId: string) => `user:${userId}:locked`;

export type CachedKey = {
  userId: string;
  apiKeyDigest: string;
  expiresAt: number;
};

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  BUSINESS = 'business',
}

export function normalizePlanTier(raw: string | undefined | null): PlanTier {
  const lower = raw?.toLowerCase();
  if (Object.values(PlanTier).includes(lower as PlanTier)) {
    return lower as PlanTier;
  }
  return PlanTier.FREE;
}

export type CachedPlan = {
  name: PlanTier;
};

export type CachedUsage = {
  storageUsage: number;
  storageLimit: number;
  minutesStreamed: number;
  minutesStreamedLimit: number;
};

export type UploadFilePart = {
    PartNumber: number;
    ETag: string;
}
