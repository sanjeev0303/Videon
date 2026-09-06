import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller';
import { PlayerService } from '../services/player.service';
import { PlayerRepository } from '../repositories/player.repository';
import { clerkAuthMiddleware, playerGuard, responseCache } from '../middleware';

export const createPlayerRouter = (): Router => {
  const router = Router();
  
  const playerRepository = new PlayerRepository();
  const playerService = new PlayerService(playerRepository);
  const playerController = new PlayerController(playerService);

  router.use(clerkAuthMiddleware);
  router.use(playerGuard);

  router.get('/loadVideo/:videoTrackingId', playerController.loadVideo);
  router.get('/settings', responseCache(60), playerController.getSettings);
  router.put('/settings', playerController.updateSettings);

  return router;
};
