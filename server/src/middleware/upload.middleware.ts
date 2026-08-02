import type { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { redisClient, prisma } from '../utils';
import { AppError } from './error.middleware';
import {
  PLAN_LRU_TTL_MS,
  PLAN_REDIS_TTL_SEC,
  planRedisKey,
  usageRedisKey,
  hardLockRedisKey,
  normalizePlanTier,
  PlanTier,
  type CachedPlan,
  type CachedUsage,
} from '../config';

// ─── Constants ───────────────────────────────────────────────────────────────

const GB = 1024 ** 3;
const TB = 1024 ** 4;

// ─── LRU Caches ──────────────────────────────────────────────────────────────

export const planCache = new LRUCache<string, CachedPlan>({
  max: 50_000,
  ttl: PLAN_LRU_TTL_MS,
  updateAgeOnGet: true,
  allowStale: false,
});

export const usageCache = new LRUCache<string, CachedUsage>({
  max: 50_000,
  ttl: PLAN_LRU_TTL_MS,
  updateAgeOnGet: true,
  allowStale: false,
});

// ─── Plan defaults ────────────────────────────────────────────────────────────

export const PLAN_DEFAULTS: Record<PlanTier, {storageLimit: number; minutesLimit: number}> = {
  [PlanTier.FREE]: {storageLimit: 5 * GB, minutesLimit: 1_000},
  [PlanTier.STARTER]: {storageLimit: 250 * GB, minutesLimit: 10_000},
  [PlanTier.PRO]: {storageLimit: 600 * GB, minutesLimit: 25_000},
  [PlanTier.BUSINESS]: {storageLimit: 2 * TB, minutesLimit: 50_000},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function isHardLocked(userId: string): Promise<boolean> {
  return (await redisClient.exists(hardLockRedisKey(userId))) === 1;
}

export async function getPlan(userId: string): Promise<CachedPlan> {
  const lruKey = `plan:${userId}`;
  
  const cached = planCache.get(lruKey);
  if (cached) return cached;

  const rKey = planRedisKey(userId);
  const rPlan = await redisClient.hgetall(rKey);
  if (rPlan?.name) {
    void redisClient.expire(rKey, PLAN_REDIS_TTL_SEC);
    const entry: CachedPlan = { name: normalizePlanTier(rPlan.name) };
    planCache.set(lruKey, entry);
    return entry;
  }

  const record = await prisma.plan.findUnique({
    where: { user_id: userId },
    select: { name: true }
  });

  const planName = normalizePlanTier(record?.name);
  const entry: CachedPlan = { name: planName };

  await redisClient.hset(rKey, { name: planName });
  await redisClient.expire(rKey, PLAN_REDIS_TTL_SEC);
  planCache.set(lruKey, entry);

  return entry;
}

export async function getUsage(
  userId: string,
  planDefaults: { storageLimit: number; minutesLimit: number } = PLAN_DEFAULTS[PlanTier.FREE]
): Promise<CachedUsage> {
  const lruKey = `usage:${userId}`;

  const cached = usageCache.get(lruKey);
  if (cached) return cached;

  const rKey = usageRedisKey(userId);
  const rUsage = await redisClient.hgetall(rKey);
  
  if (rUsage?.storageUsage !== undefined) {
    void redisClient.expire(rKey, PLAN_REDIS_TTL_SEC);
    const entry: CachedUsage = {
      storageUsage: Number(rUsage.storageUsage),
      storageLimit: Number(rUsage.storageLimit),
      minutesStreamed: Number(rUsage.minutesStreamed),
      minutesStreamedLimit: Number(rUsage.minutesStreamedLimit),
    };
    usageCache.set(lruKey, entry);
    return entry;
  }

  const record = await prisma.usage.findUnique({
    where: { user_id: userId },
    select: {
      storage_usage: true,
      storage_limit: true,
      minutes_streamed: true,
      minutes_streamed_limit: true,
    },
  });

  if (!record) {
    prisma.usage.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        storage_usage: 0,
        storage_limit: PLAN_DEFAULTS[PlanTier.FREE].storageLimit,
        minutes_streamed: 0,
        minutes_streamed_limit: PLAN_DEFAULTS[PlanTier.FREE].minutesLimit,
      },
      update: {}
    }).catch((err) =>
      console.log(`[UploadGuard] Failed to seed usage row for ${userId}`, err)
    );

    const defaultEntry: CachedUsage = {
      storageUsage: 0,
      storageLimit: planDefaults.storageLimit,
      minutesStreamed: 0,
      minutesStreamedLimit: planDefaults.minutesLimit,
    };
    
    await redisClient.hset(rKey, {
      storageUsage: String(defaultEntry.storageUsage),
      storageLimit: String(defaultEntry.storageLimit),
      minutesStreamed: String(defaultEntry.minutesStreamed),
      minutesStreamedLimit: String(defaultEntry.minutesStreamedLimit),
    });
    await redisClient.expire(rKey, PLAN_REDIS_TTL_SEC);
    usageCache.set(lruKey, defaultEntry);
    
    return defaultEntry;
  }

  const entry: CachedUsage = {
    storageUsage: Number(record.storage_usage ?? 0),
    storageLimit: Number(record.storage_limit ?? planDefaults.storageLimit),
    minutesStreamed: Number(record.minutes_streamed ?? 0),
    minutesStreamedLimit: Number(record.minutes_streamed_limit ?? planDefaults.minutesLimit),
  };

  await redisClient.hset(rKey, {
    storageUsage: String(entry.storageUsage),
    storageLimit: String(entry.storageLimit),
    minutesStreamed: String(entry.minutesStreamed),
    minutesStreamedLimit: String(entry.minutesStreamedLimit),
  });
  await redisClient.expire(rKey, PLAN_REDIS_TTL_SEC);
  usageCache.set(lruKey, entry);

  return entry;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const uploadGuard = async (
  request: Request & { plan?: string; user?: { id: string } },
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  const userId: string | undefined = request.user?.id;

  if (!userId) {
    return next(new AppError('Unauthorized!', 401));
  }

  if (await isHardLocked(userId)) {
    return next(
      new AppError(
        'Your account has been locked. You have exceeded the usage limit for your current plan. ' +
        'Please upgrade your Videon plan to continue uploading.',
        403,
      ),
    );
  }

  const plan = await getPlan(userId);
  request.plan = plan.name;

  const planDefaults = PLAN_DEFAULTS[plan.name] ?? PLAN_DEFAULTS[PlanTier.FREE];
  
  const usage = await getUsage(userId, planDefaults);

  const effectiveStorageLimit = usage.storageLimit > 0
    ? usage.storageLimit
    : planDefaults.storageLimit;

  if (usage.storageUsage >= effectiveStorageLimit) {
    return next(
      new AppError(
        'You have reached your storage quota. Please upgrade your Videon plan.',
        403,
      ),
    );
  }
  
  const incomingBytes: number =
    (request?.body?.videoSize ?? 0) + (request?.body?.thumbnailSize ?? 0);

  if (
    incomingBytes > 0 &&
    usage.storageUsage + incomingBytes > effectiveStorageLimit
  ) {
    const remainingMB = Math.floor(
      (effectiveStorageLimit - usage.storageUsage) / 1024 ** 2,
    );

    return next(
      new AppError(
        `This upload (${Math.ceil(incomingBytes / 1024 ** 2)} MB) exceeds your storage quota (${remainingMB} MB left). Please upgrade your Videon plan.`,
        403,
      ),
    );
  }

  return next();
};
