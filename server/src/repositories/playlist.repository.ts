import { prisma } from '../utils/prisma';
import type { IPlaylistRepository } from '../interfaces';
import type { Playlist } from '../../generated/prisma/client';

export class PlaylistRepository implements IPlaylistRepository {
    async create(data: Omit<Playlist, 'created_at' | 'totalVideos'>): Promise<Playlist> {
        return await prisma.playlist.create({
            data: {
                id: data.id,
                user_id: data.user_id,
                name: data.name,
                description: data.description,
                limit: data.limit,
                created_at: new Date(),
            }
        });
    }

    async findById(id: string): Promise<Playlist | null> {
        const playlist = await prisma.playlist.findUnique({
            where: { id },
        });
        
        if (!playlist) return null;
        
        const count = await prisma.videoMetadata.count({
            where: { playlist_id: id }
        });
        
        return {
            ...playlist,
            totalVideos: count
        };
    }

    async findByUserId(userId: string): Promise<Playlist[]> {
        const playlists = await prisma.playlist.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
        
        if (playlists.length === 0) return playlists;
        
        const playlistIds = playlists.map(p => p.id);
        const videoCounts = await prisma.videoMetadata.groupBy({
            by: ['playlist_id'],
            where: {
                user_id: userId,
                playlist_id: { in: playlistIds }
            },
            _count: {
                id: true
            }
        });
        
        const countMap = new Map(videoCounts.map(vc => [vc.playlist_id, vc._count.id]));
        
        return playlists.map(p => ({
            ...p,
            totalVideos: countMap.get(p.id) || 0
        }));
    }

    async countByUserId(userId: string): Promise<number> {
        return await prisma.playlist.count({
            where: { user_id: userId },
        });
    }

    async update(id: string, data: Partial<Playlist>): Promise<Playlist> {
        return await prisma.playlist.update({
            where: { id },
            data,
        });
    }

    async delete(userId: string, playlistId: string): Promise<void> {
        await prisma.playlist.delete({
            where: { 
                id: playlistId,
                user_id: userId
            },
        });
    }
}
