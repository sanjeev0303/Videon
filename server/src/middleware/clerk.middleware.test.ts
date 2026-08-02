import { clerkAuthMiddleware } from './clerk.middleware';
import { verifyToken } from '@clerk/backend';
import { redisClient, localCache, extractKeyId, digest } from '../utils';
import { ApiKeyService } from '../services';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

// Mock dependencies
jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../utils', () => ({
  redisClient: {
    hgetall: jest.fn(),
    hset: jest.fn(),
    expire: jest.fn(),
    set: jest.fn(),
  },
  localCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  extractKeyId: jest.fn(),
  digest: jest.fn(),
}));

jest.mock('../services', () => {
  const sharedValidateApiKeyMock = jest.fn();
  return {
    ApiKeyService: jest.fn().mockImplementation(() => ({
      validateApiKey: sharedValidateApiKeyMock,
    })),
    __getSharedValidateApiKeyMock: () => sharedValidateApiKeyMock,
  };
});
jest.mock('../repositories', () => ({
  ApiKeyRepository: jest.fn(),
}));

describe('clerkAuthMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockValidateApiKey: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const { __getSharedValidateApiKeyMock } = require('../services');
    mockValidateApiKey = __getSharedValidateApiKeyMock();

    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
    
    // Default Redis Set success (for trackApiKeyLastUsed lock)
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
  });

  describe('JWT Authentication', () => {
    it('should return 401 if missing auth token', async () => {
      await clerkAuthMiddleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe('Missing authentication token');
    });

    it('should call next with error if token verification fails', async () => {
      req.headers = { authorization: 'Bearer invalid_token' };
      (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toContain('something went wrong');
    });

    it('should authenticate user and call next if token is valid', async () => {
      req.headers = { authorization: 'Bearer valid_token' };
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_1', exp: 1234 });

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user_1');
      expect(next).toHaveBeenCalledWith(); // Called without arguments (success)
    });
  });

  describe('API Key Authentication', () => {
    it('should return 401 if api key is structurally invalid', async () => {
      req.headers = { 'x-api-key': 'invalid_format' };
      (extractKeyId as jest.Mock).mockReturnValue(null);

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe('Invalid API key');
    });

    it('should hit LRU cache and authenticate immediately', async () => {
      req.headers = { 'x-api-key': 'valid_key' };
      const keyId = '123';
      const d = 'digest_hash';

      (extractKeyId as jest.Mock).mockReturnValue(keyId);
      (digest as jest.Mock).mockReturnValue(d);
      
      // LRU hit
      (localCache.get as jest.Mock).mockReturnValue({
        userId: 'user_1',
        apiKeyDigest: d,
        expiresAt: Date.now() + 10000,
      });

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(localCache.get).toHaveBeenCalled();
      expect(req.user).toEqual({ id: 'user_1', keyId });
      expect(next).toHaveBeenCalledWith(); // Success
    });

    it('should hit Redis cache, update LRU, and authenticate', async () => {
      req.headers = { 'x-api-key': 'valid_key' };
      const keyId = '123';
      const d = 'digest_hash';

      (extractKeyId as jest.Mock).mockReturnValue(keyId);
      (digest as jest.Mock).mockReturnValue(d);
      
      // LRU miss
      (localCache.get as jest.Mock).mockReturnValue(undefined);
      
      // Redis hit
      (redisClient.hgetall as jest.Mock).mockResolvedValue({
        user_id: 'user_1',
        apiKeyDigest: d,
      });

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(redisClient.hgetall).toHaveBeenCalled();
      expect(localCache.set).toHaveBeenCalled(); // Should update LRU
      expect(req.user).toEqual({ id: 'user_1', keyId });
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject if Redis cache marks key as invalid', async () => {
      req.headers = { 'x-api-key': 'valid_key' };
      (extractKeyId as jest.Mock).mockReturnValue('123');
      (digest as jest.Mock).mockReturnValue('d');
      
      (localCache.get as jest.Mock).mockReturnValue(undefined);
      (redisClient.hgetall as jest.Mock).mockResolvedValue({ invalid: "1" });

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe('Unauthorized!');
    });

    it('should fallback to DB, cache result, and authenticate', async () => {
      req.headers = { 'x-api-key': 'valid_key' };
      const keyId = '123';
      const d = 'digest_hash';

      (extractKeyId as jest.Mock).mockReturnValue(keyId);
      (digest as jest.Mock).mockReturnValue(d);
      
      (localCache.get as jest.Mock).mockReturnValue(undefined);
      (redisClient.hgetall as jest.Mock).mockResolvedValue(null);
      
      // DB hit
      mockValidateApiKey.mockResolvedValue({ user_id: 'user_1' });

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(mockValidateApiKey).toHaveBeenCalledWith('valid_key');
      expect(redisClient.hset).toHaveBeenCalled(); // Cached in redis
      expect(localCache.set).toHaveBeenCalled(); // Cached in LRU
      expect(req.user).toEqual({ id: 'user_1', keyId });
      expect(next).toHaveBeenCalledWith();
    });

    it('should cache invalid attempt in Redis if DB validation fails', async () => {
      req.headers = { 'x-api-key': 'valid_key' };
      (extractKeyId as jest.Mock).mockReturnValue('123');
      
      (localCache.get as jest.Mock).mockReturnValue(undefined);
      (redisClient.hgetall as jest.Mock).mockResolvedValue(null);
      
      // DB miss
      mockValidateApiKey.mockResolvedValue(null);

      await clerkAuthMiddleware(req as Request, res as Response, next);

      expect(redisClient.hset).toHaveBeenCalledWith(expect.any(String), { invalid: "1" });
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
