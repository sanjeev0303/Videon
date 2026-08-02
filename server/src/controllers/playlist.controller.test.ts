import { PlaylistController } from './playlist.controller';
import { IPlaylistService } from '../interfaces';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { Request, Response, NextFunction } from 'express';

describe('PlaylistController', () => {
  const mockService = mockDeep<IPlaylistService>();
  let playlistController: PlaylistController;

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReset(mockService);
    jest.clearAllMocks();
    playlistController = new PlaylistController(mockService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('create', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockReq = { body: { name: 'Test' } };
      await playlistController.create(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should call service create and return 201', async () => {
      mockReq = { body: { name: 'Test' }, user: { id: 'user_1' } } as any;
      mockService.create.mockResolvedValue({ id: 'p_1', name: 'Test' } as any);
      
      await playlistController.create(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockService.create).toHaveBeenCalledWith('user_1', { name: 'Test' });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Playlist created successfully',
        playlist: { id: 'p_1', name: 'Test' }
      }));
    });

    it('should call next with error if service throws', async () => {
      mockReq = { body: { name: 'Test' }, user: { id: 'user_1' } } as any;
      const err = new Error('Limit reached');
      mockService.create.mockRejectedValue(err);
      
      await playlistController.create(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(err);
    });
  });

  describe('findAll', () => {
    it('should return 401 if not authenticated', async () => {
      mockReq = {};
      await playlistController.findAll(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return playlists with 200 status', async () => {
      mockReq = { user: { id: 'user_1' } } as any;
      mockService.findAll.mockResolvedValue([{ id: 'p_1' }] as any);
      
      await playlistController.findAll(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.findAll).toHaveBeenCalledWith('user_1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([{ id: 'p_1' }]);
    });
  });

  describe('findOne', () => {
    it('should return 401 if not authenticated', async () => {
      mockReq = { params: { id: 'p_1' } };
      await playlistController.findOne(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return playlist with 200 status', async () => {
      mockReq = { user: { id: 'user_1' }, params: { id: 'p_1' } } as any;
      mockService.findOne.mockResolvedValue({ id: 'p_1' } as any);
      
      await playlistController.findOne(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.findOne).toHaveBeenCalledWith('user_1', 'p_1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ id: 'p_1' });
    });
  });

  describe('update', () => {
    it('should return 401 if not authenticated', async () => {
      mockReq = { params: { id: 'p_1' }, body: { name: 'Updated' } };
      await playlistController.update(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should update and return playlist with 200 status', async () => {
      mockReq = { user: { id: 'user_1' }, params: { id: 'p_1' }, body: { name: 'Updated' } } as any;
      mockService.update.mockResolvedValue({ id: 'p_1', name: 'Updated' } as any);
      
      await playlistController.update(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.update).toHaveBeenCalledWith('user_1', 'p_1', { name: 'Updated' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        playlist: { id: 'p_1', name: 'Updated' }
      }));
    });
  });

  describe('delete', () => {
    it('should return 401 if not authenticated', async () => {
      mockReq = { params: { id: 'p_1' } };
      await playlistController.delete(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should delete and return success message with 200 status', async () => {
      mockReq = { user: { id: 'user_1' }, params: { id: 'p_1' } } as any;
      mockService.delete.mockResolvedValue({ id: 'p_1' } as any);
      
      await playlistController.delete(mockReq as Request, mockRes as Response, mockNext);
      expect(mockService.delete).toHaveBeenCalledWith('user_1', 'p_1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Playlist deleted successfully',
        playlist: { id: 'p_1' }
      }));
    });
  });
});
