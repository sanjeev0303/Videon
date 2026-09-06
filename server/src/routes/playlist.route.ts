import { Router } from 'express';
import { PlaylistController } from '../controllers';
import { PlaylistService } from '../services';
import { PlaylistRepository } from '../repositories';
import { clerkAuthMiddleware, responseCache } from '../middleware';

export const createPlaylistRouter = (): Router => {
    const playlistRepository = new PlaylistRepository();
    const playlistService = new PlaylistService(playlistRepository);
    const playlistController = new PlaylistController(playlistService);

    const router = Router();

    // Apply Clerk middleware to all playlist routes
    router.use(clerkAuthMiddleware);


    router.post('/', playlistController.create);
    router.get('/', responseCache(60), playlistController.findAll);
    router.get('/:id', responseCache(60), playlistController.findOne);
    router.put('/:id', playlistController.update);
    router.delete('/:id', playlistController.delete);

    return router;
};
