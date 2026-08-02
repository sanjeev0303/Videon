import { PlaylistService } from './playlist.service';
import { IPlaylistRepository } from '../interfaces';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { AppError } from '../middleware/error.middleware';
import crypto from 'crypto';

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234')
}));

describe('PlaylistService', () => {
  const mockRepository = mockDeep<IPlaylistRepository>();
  let playlistService: PlaylistService;

  beforeEach(() => {
    mockReset(mockRepository);
    jest.clearAllMocks();
    playlistService = new PlaylistService(mockRepository);
  });

  describe('create', () => {
    it('should throw AppError if user has 20 or more playlists', async () => {
      mockRepository.countByUserId.mockResolvedValue(20);

      await expect(
        playlistService.create('user_1', { name: 'New Playlist' })
      ).rejects.toThrow(AppError);
      
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should generate a UUID and create a playlist if under the limit', async () => {
      mockRepository.countByUserId.mockResolvedValue(5);
      mockRepository.create.mockResolvedValue({ id: 'test-uuid-1234', name: 'New Playlist' } as any);

      const result = await playlistService.create('user_1', { name: 'New Playlist' });

      expect(mockRepository.create).toHaveBeenCalledWith({
        id: 'test-uuid-1234',
        user_id: 'user_1',
        name: 'New Playlist',
        description: null,
        limit: 10
      });
      expect(result.id).toEqual('test-uuid-1234');
    });
  });

  describe('findAll', () => {
    it('should return playlists for a user', async () => {
      mockRepository.findByUserId.mockResolvedValue([{ id: 'p_1' }] as any);
      const result = await playlistService.findAll('user_1');
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user_1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw AppError if playlist does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(playlistService.findOne('user_1', 'p_1')).rejects.toThrow(AppError);
    });

    it('should throw AppError if user_id does not match', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'p_1', user_id: 'user_2' } as any);
      await expect(playlistService.findOne('user_1', 'p_1')).rejects.toThrow(AppError);
    });

    it('should return playlist if user_id matches', async () => {
      const mockPlaylist = { id: 'p_1', user_id: 'user_1' };
      mockRepository.findById.mockResolvedValue(mockPlaylist as any);
      const result = await playlistService.findOne('user_1', 'p_1');
      expect(result).toEqual(mockPlaylist);
    });
  });

  describe('update', () => {
    it('should throw AppError if playlist not found or wrong user', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(playlistService.update('user_1', 'p_1', {})).rejects.toThrow(AppError);
    });

    it('should update and return playlist', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'p_1', user_id: 'user_1' } as any);
      mockRepository.update.mockResolvedValue({ id: 'p_1', name: 'Updated' } as any);
      const result = await playlistService.update('user_1', 'p_1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should throw AppError if playlist not found or wrong user', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'p_1', user_id: 'user_2' } as any);
      await expect(playlistService.delete('user_1', 'p_1')).rejects.toThrow(AppError);
    });

    it('should delete and return deleted playlist', async () => {
      const mockPlaylist = { id: 'p_1', user_id: 'user_1' };
      mockRepository.findById.mockResolvedValue(mockPlaylist as any);
      const result = await playlistService.delete('user_1', 'p_1');
      expect(mockRepository.delete).toHaveBeenCalledWith('user_1', 'p_1');
      expect(result).toEqual(mockPlaylist);
    });
  });
});
