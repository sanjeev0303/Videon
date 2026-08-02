import { ApiKeyService } from './api-key.service';
import { IApiKeyRepository } from '../interfaces';
import { mockDeep, mockReset } from 'jest-mock-extended';
import * as utils from '../utils';
import * as argon2 from 'argon2';

jest.mock('../utils', () => ({
  extractKeyId: jest.fn(),
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    hget: jest.fn(),
  },
  localCache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }
}));

jest.mock('argon2');

describe('ApiKeyService', () => {
  const mockRepository = mockDeep<IApiKeyRepository>();
  let apiKeyService: ApiKeyService;

  beforeEach(() => {
    mockReset(mockRepository);
    jest.clearAllMocks();
    apiKeyService = new ApiKeyService(mockRepository);
  });

  describe('createApiKey', () => {
    it('should generate a new API key, hash it, and save it via repository', async () => {
      const mockDto = { name: 'Test Key', user_id: 'user_1' };
      const expectedKeyStr = 'VMX_';
      
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_value');
      mockRepository.create.mockResolvedValue({ id: 'key_1', name: 'Test Key' } as any);

      const result = await apiKeyService.createApiKey(mockDto);

      expect(argon2.hash).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...mockDto,
        id: expect.any(String),
        value: 'hashed_value',
        prefix: expect.stringContaining(expectedKeyStr),
      }));

      expect(result.apiKey).toBeDefined();
      expect(result.unhashedKey).toBeDefined();
    });
  });

  describe('validateApiKey', () => {
    it('should return valid key details if argon2 verification passes', async () => {
      const plainKey = 'vmx_live_12345';
      const keyId = '12345';
      const mockKeyData = { id: keyId, value: 'hashed_value' };

      (utils.extractKeyId as jest.Mock).mockReturnValue(keyId);
      mockRepository.findById.mockResolvedValue(mockKeyData as any);
      mockRepository.update.mockResolvedValue(mockKeyData as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await apiKeyService.validateApiKey(plainKey);

      expect(utils.extractKeyId).toHaveBeenCalledWith(plainKey);
      expect(mockRepository.findById).toHaveBeenCalledWith(keyId);
      expect(argon2.verify).toHaveBeenCalledWith('hashed_value', plainKey);
      expect(result).toEqual(mockKeyData);
    });

    it('should return null if argon2 verification fails', async () => {
      const plainKey = 'vmx_live_12345';
      const keyId = '12345';
      
      (utils.extractKeyId as jest.Mock).mockReturnValue(keyId);
      mockRepository.findById.mockResolvedValue({ id: keyId, value: 'hashed_value' } as any);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await apiKeyService.validateApiKey(plainKey);
      expect(result).toBeNull();
    });
  });

  describe('deleteApiKey', () => {
    it('should call repository delete and invalidate cache', async () => {
      await apiKeyService.deleteApiKey('user_1', 'key_1');
      
      expect(mockRepository.deleteApiKey).toHaveBeenCalledWith('user_1', 'key_1');
      expect(utils.redisClient.del).toHaveBeenCalledWith(expect.stringContaining('key_1'));
      expect(utils.localCache.delete).toHaveBeenCalledWith(expect.stringContaining('key_1'));
    });
  });
  
  describe('regenerateApiKey', () => {
    it('should regenerate key, update DB, and clear cache', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('new_hash');
      
      const result = await apiKeyService.regenerateApiKey('user_1', 'key_1');
      
      expect(mockRepository.regenerateApiKey).toHaveBeenCalledWith(
          'user_1', 
          'key_1', 
          expect.any(String), 
          'new_hash', 
          expect.any(String)
      );
      
      expect(utils.redisClient.del).toHaveBeenCalledWith(expect.stringContaining('key_1'));
      expect(utils.localCache.delete).toHaveBeenCalledWith(expect.stringContaining('key_1'));
      expect(result.key).toBeDefined();
    });
  });

  describe('getApiKeyLastUsed', () => {
    it('should return from redis if present', async () => {
      const now = Date.now().toString();
      (utils.redisClient.hget as jest.Mock).mockResolvedValue(now);

      const result = await apiKeyService.getApiKeyLastUsed('key_1');

      expect(utils.redisClient.hget).toHaveBeenCalledWith(expect.any(String), 'key_1');
      expect(result).toEqual(new Date(Number(now)));
    });

    it('should fallback to DB if missing in redis', async () => {
      const dbDate = new Date();
      (utils.redisClient.hget as jest.Mock).mockResolvedValue(null);
      mockRepository.getApiKeyLastUsed.mockResolvedValue(dbDate);

      const result = await apiKeyService.getApiKeyLastUsed('key_1');

      expect(mockRepository.getApiKeyLastUsed).toHaveBeenCalledWith('key_1');
      expect(result).toEqual(dbDate);
    });
  });
});
