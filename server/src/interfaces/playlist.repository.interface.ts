import type { Playlist } from '../../generated/prisma/client';

export interface IPlaylistRepository {
    create(data: Omit<Playlist, 'created_at' | 'totalVideos'>): Promise<Playlist>;
    findById(id: string): Promise<Playlist | null>;
    findByUserId(userId: string): Promise<Playlist[]>;
    countByUserId(userId: string): Promise<number>;
    update(id: string, data: Partial<Playlist>): Promise<Playlist>;
    delete(userId: string, playlistId: string): Promise<void>;
}
