import crypto from 'crypto';
import type { IPlaylistService, IPlaylistRepository } from '../interfaces';
import type { CreatePlaylistDto, UpdatePlaylistDto } from '../dto';
import type { Playlist } from '../../generated/prisma/client';
import { AppError } from '../middleware/error.middleware';

export class PlaylistService implements IPlaylistService {
    constructor(private readonly playlistRepository: IPlaylistRepository) {}

    async create(userId: string, dto: CreatePlaylistDto): Promise<Playlist> {
        const count = await this.playlistRepository.countByUserId(userId);
        if (count >= 20) {
            throw new AppError('Maximum playlist limit reached. Contact support for adding more playlists', 400);
        }

        const id = crypto.randomUUID();
        
        return await this.playlistRepository.create({
            id,
            user_id: userId,
            name: dto.name,
            description: dto.description ?? null,
            limit: dto.limit ?? 10,
        });
    }

    async findAll(userId: string): Promise<Playlist[]> {
        return await this.playlistRepository.findByUserId(userId);
    }

    async findOne(userId: string, id: string): Promise<Playlist> {
        const record = await this.playlistRepository.findById(id);
        
        if (!record || record.user_id !== userId) {
            throw new AppError('Playlist not found', 404);
        }
        
        return record;
    }

    async update(userId: string, id: string, dto: UpdatePlaylistDto): Promise<Playlist> {
        const existing = await this.playlistRepository.findById(id);
        
        if (!existing || existing.user_id !== userId) {
            throw new AppError('Playlist not found', 404);
        }

        return await this.playlistRepository.update(id, dto);
    }

    async delete(userId: string, id: string): Promise<Playlist> {
        const existing = await this.playlistRepository.findById(id);
        
        if (!existing || existing.user_id !== userId) {
            throw new AppError('Playlist not found', 404);
        }

        await this.playlistRepository.delete(userId, id);
        return existing;
    }
}
