import type { Playlist } from '../../generated/prisma/client';
import type { CreatePlaylistDto, UpdatePlaylistDto } from '../dto';

export interface IPlaylistService {
    create(userId: string, dto: CreatePlaylistDto): Promise<Playlist>;
    findAll(userId: string): Promise<Playlist[]>;
    findOne(userId: string, id: string): Promise<Playlist>;
    update(userId: string, id: string, dto: UpdatePlaylistDto): Promise<Playlist>;
    delete(userId: string, id: string): Promise<Playlist>;
}
