import type { Request, Response, NextFunction } from 'express';
import type { IPlaylistService } from '../interfaces';
import type { CreatePlaylistDto, UpdatePlaylistDto } from '../dto';
import { AppError } from '../middleware/error.middleware';

export class PlaylistController {
    constructor(private readonly playlistService: IPlaylistService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data: CreatePlaylistDto = req.body;
            const userId = req.user?.id;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const playlist = await this.playlistService.create(userId, data);
            res.status(201).json({
                message: 'Playlist created successfully',
                playlist
            });
        } catch (error) {
            next(error);
        }
    };

    findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const playlists = await this.playlistService.findAll(userId);
            res.status(200).json(playlists);
        } catch (error) {
            next(error);
        }
    };

    findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const playlist = await this.playlistService.findOne(userId, id as string);
            res.status(200).json(playlist);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const data: UpdatePlaylistDto = req.body;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const updated = await this.playlistService.update(userId, id as string, data);
            res.status(200).json({ message: 'Playlist updated successfully', playlist: updated });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const deleted = await this.playlistService.delete(userId, id as string);
            res.status(200).json({ message: 'Playlist deleted successfully', playlist: deleted });
        } catch (error) {
            next(error);
        }
    };
}
