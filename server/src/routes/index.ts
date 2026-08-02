import { Router } from 'express';
import { createApiKeyRouter } from './api-key.route';
import { createPlaylistRouter } from './playlist.route';
import { createUploadRouter } from './upload.route';
import { createPlayerRouter } from './player.route';
import { createAnalyticsRouter } from './analytics.route';
import { billingRouter } from './billing.route';
import { createBrandingRouter } from './branding.route';

export const createRoutes = (): Router => {
  const router = Router();

  router.use('/api-keys', createApiKeyRouter());
  router.use('/playlists', createPlaylistRouter());
  router.use('/upload', createUploadRouter());
  router.use('/player', createPlayerRouter());
  router.use('/analytics', createAnalyticsRouter());
  router.use('/billing', billingRouter);
  router.use('/branding', createBrandingRouter());

  return router;
};

export * from './api-key.route';
export * from './playlist.route';
export * from './upload.route';
export * from './player.route';
export * from './analytics.route';
export * from './billing.route';
export * from './branding.route';
