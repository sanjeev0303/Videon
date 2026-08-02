import { verifyToken } from '@clerk/backend';
import type { Request, Response, NextFunction } from 'express';
import { redisClient, localCache, extractKeyId, digest } from '../utils';
import { ApiKeyService } from '../services';
import { ApiKeyRepository } from '../repositories';
import { AppError } from './error.middleware';
import { 
  appConfig, 
  VERSION, 
  REDIS_HARD_TTL, 
  LRU_SOFT_TTL_MS, 
  LAST_USED_DEBOUNCE_SEC, 
  LAST_USED_HASH 
} from '../config';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const apiKeyRepository = new ApiKeyRepository();
const apiKeyService = new ApiKeyService(apiKeyRepository);

const trackApiKeyLastUsed = async (keyId: string) => {
  try {
    const lockKey = `vmx:api_key:last_used_lock:${VERSION}:${keyId}`;
    
    // Use NX to only set if it doesn't exist, EX for expiration
    const ok = await redisClient.set(lockKey, '1', 'EX', LAST_USED_DEBOUNCE_SEC, "NX");
    if (!ok) return;

    await redisClient.hset(LAST_USED_HASH, keyId, Date.now().toString());
  } catch (error) {
    console.error("Error tracking API key last used", error);
  }
};

export const clerkAuthMiddleware = async (
  request: Request,
  _response: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = request.headers['x-api-key'] as string | undefined;

  if (apiKey) {
    const keyId = extractKeyId(apiKey);
    if (!keyId) {
      return next(new AppError('Invalid API key', 401));
    }

    const d = digest(apiKey);
    const lruKey = `${VERSION}:${keyId}`;
    const now = Date.now();

    try {
      const c = localCache.get(lruKey);
      if (c && c.expiresAt > now && c.apiKeyDigest === d) {
        request.user = {
          id: c.userId,
          keyId,
        };
        void trackApiKeyLastUsed(keyId);
        return next();
      }
    } catch (error) {
      console.error("Local cache error", error);
    }

    const rKeyDigest = `vmx:api_key:${VERSION}:${keyId}`;
    const rDigest = await redisClient.hgetall(rKeyDigest);

    if (rDigest && Object.keys(rDigest).length > 0) {
      if (rDigest.invalid === "1" || rDigest.apiKeyDigest !== d) {
        return next(new AppError('Unauthorized!', 401));
      }

      if (rDigest.user_id) {
        localCache.set(lruKey, {
          userId: rDigest.user_id,
          apiKeyDigest: d,
          expiresAt: now + LRU_SOFT_TTL_MS,
        });

        request.user = {
          id: rDigest.user_id,
          keyId,
        };
        void trackApiKeyLastUsed(keyId);
        return next();
      }
    }

    // Validate using DB fallback
    const validKey = await apiKeyService.validateApiKey(apiKey);
    if (!validKey) {
      // Optionally cache invalid attempts to prevent DB DOS
      await redisClient.hset(rKeyDigest, { invalid: "1" });
      await redisClient.expire(rKeyDigest, 60); // Short TTL for invalid attempts
      return next(new AppError('Unauthorized!', 401));
    }

    await redisClient.hset(rKeyDigest, {
      user_id: validKey.user_id,
      apiKeyDigest: d,
    });
    await redisClient.expire(rKeyDigest, REDIS_HARD_TTL);

    localCache.set(lruKey, {
      userId: validKey.user_id,
      apiKeyDigest: d,
      expiresAt: Date.now() + LRU_SOFT_TTL_MS,
    });

    request.user = { id: validKey.user_id, keyId };
    void trackApiKeyLastUsed(keyId);
    return next();
  } else {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new AppError('Missing authentication token', 401));
    }

    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: appConfig.clerkSecretKey,
      });

      request.user = {
        id: verifiedToken.sub,
        ...verifiedToken
      };

      return next();
    } catch (error) {
      return next(new AppError('something went wrong! please upload your file by using our SDK', 401));
    }
  }
};
