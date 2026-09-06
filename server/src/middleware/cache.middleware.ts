import type { Request, Response, NextFunction } from 'express';
import { getResponseCache, setResponseCache } from '../utils';

const CACHE_CONTROL = 'private, max-age=0, must-revalidate';

// Single-flight map: concurrent requests for the same (user, path) wait for
// the in-flight leader instead of stampeding the origin the moment a cache
// entry expires.
const inFlight = new Map<string, Promise<string | null>>();

const applyCacheHeaders = (res: Response, status: 'HIT' | 'MISS'): void => {
  res.setHeader('X-Cache', status);
  res.setHeader('Cache-Control', CACHE_CONTROL);
};

/**
 * Cache-aside middleware for GET endpoints that already ran authentication.
 * Serve-through writes: a HIT responds from cache, a MISS captures the JSON
 * body produced by the handler, caches it (per user, using the request's
 * originalUrl — query string included) and shares it with concurrent waiters.
 * Error responses and non-GET methods pass through untouched.
 */
export const responseCache = (ttlSec: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      return next();
    }

    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return next();
    }

    const path = req.originalUrl || req.url;
    const flightKey = `${userId}:${path}`;

    // 1) Cache lookup (LRU, then Redis hard tier).
    const cached = await getResponseCache(userId, path);
    if (cached !== null) {
      applyCacheHeaders(res, 'HIT');
      res.status(200).type('json').send(cached);
      return;
    }

    // 2) Concurrent duplicate request — await the leader's payload.
    const pending = inFlight.get(flightKey);
    if (pending) {
      const payload = await pending;
      if (payload !== null) {
        applyCacheHeaders(res, 'MISS');
        res.status(200).type('json').send(payload);
        return;
      }
    }

    // 3) Leader: become the flight, wrap res.json to capture + cache the body.
    let resolveFlight!: (payload: string | null) => void;
    let settled = false;
    const flight = new Promise<string | null>((resolve) => {
      resolveFlight = resolve;
    });
    inFlight.set(flightKey, flight);

    const cleanup = (): void => {
      if (!settled) {
        settled = true;
        resolveFlight(null);
      }
      inFlight.delete(flightKey);
    };

    const originalJson = res.json.bind(res) as typeof res.json;
    res.json = ((body: unknown) => {
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        settled = true;
        resolveFlight(JSON.stringify(body));
        inFlight.delete(flightKey);
        applyCacheHeaders(res, 'MISS');
        void setResponseCache(userId, path, body, ttlSec);
      } else {
        cleanup();
      }
      return originalJson(body);
    }) as typeof res.json;

    // Safety net: if the handler errors out or never calls res.json, never
    // leave waiters hanging on an unresolved flight.
    res.on('finish', cleanup);
    res.on('close', cleanup);

    next();
  };
};