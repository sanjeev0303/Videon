import { ApiKeyController } from './api-key.controller';
import { IApiKeyService } from '../interfaces';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { Request, Response } from 'express';

describe('ApiKeyController', () => {
  const mockService = mockDeep<IApiKeyService>();
  let controller: ApiKeyController;
  
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockReset(mockService);
    controller = new ApiKeyController(mockService);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    req = {};
    res = {
      status: statusMock as any,
      json: jsonMock as any,
    };
  });

  describe('create', () => {
    it('should return 401 if user is not authenticated', async () => {
      req.body = { name: 'Test Key' };
      req.user = undefined;

      await controller.create(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should create an API key and return 201', async () => {
      req.body = { name: 'Test Key' };
      req.user = { id: 'user_1' };

      mockService.createApiKey.mockResolvedValue({
        apiKey: { id: 'key_1', name: 'Test Key' } as any,
        unhashedKey: 'vmx_live_123',
      });

      await controller.create(req as Request, res as Response);

      expect(mockService.createApiKey).toHaveBeenCalledWith({
        name: 'Test Key',
        user_id: 'user_1'
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'API Key created successfully',
        apiKey: expect.any(Object),
        unhashedKey: 'vmx_live_123'
      });
    });
  });

  describe('validate', () => {
    it('should return 400 if key is missing from body', async () => {
      req.body = {};

      await controller.validate(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'key is required in body' });
    });

    it('should return 401 if key is invalid', async () => {
      req.body = { key: 'invalid_key' };
      mockService.validateApiKey.mockResolvedValue(null);

      await controller.validate(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid, expired, or revoked API key' });
    });

    it('should return 200 if key is valid', async () => {
      req.body = { key: 'valid_key' };
      mockService.validateApiKey.mockResolvedValue({ id: 'key_1' } as any);

      await controller.validate(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'API Key is valid',
        apiKey: { id: 'key_1' }
      });
    });
  });

  describe('delete', () => {
    it('should revoke API key and return 200', async () => {
      req.user = { id: 'user_1' };
      req.params = { id: 'key_1' };

      await controller.delete(req as Request, res as Response);

      expect(mockService.deleteApiKey).toHaveBeenCalledWith('user_1', 'key_1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'API Key revoked successfully' });
    });
  });
  
  describe('regenerate', () => {
    it('should regenerate API key and return 200', async () => {
      req.user = { id: 'user_1' };
      req.params = { id: 'key_1' };
      
      mockService.regenerateApiKey.mockResolvedValue({ key: 'new_plain_key' });

      await controller.regenerate(req as Request, res as Response);

      expect(mockService.regenerateApiKey).toHaveBeenCalledWith('user_1', 'key_1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ key: 'new_plain_key' });
    });
  });

  describe('lastUsed', () => {
    it('should return last used timestamp and return 200', async () => {
      const now = new Date();
      req.user = { id: 'user_1' };
      req.params = { id: 'key_1' };

      mockService.getApiKeyLastUsed.mockResolvedValue(now);

      await controller.lastUsed(req as Request, res as Response);

      expect(mockService.getApiKeyLastUsed).toHaveBeenCalledWith('key_1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ last_used_at: now });
    });
  });
});
