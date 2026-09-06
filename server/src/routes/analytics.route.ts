import { Router } from 'express';
import { handleAnalyticsEvent, getAnalytics, getMainAnalytics } from '../controllers/analytics.controller';
import { clerkAuthMiddleware, responseCache } from '../middleware';

export const createAnalyticsRouter = (): Router => {
  const router = Router();
  
  // No Clerk auth here — the handler validates its own analyticsToken (JWT signed internally)
  router.post('/event', handleAnalyticsEvent);

  // Authenticated routes
  router.get('/', clerkAuthMiddleware, responseCache(60), getAnalytics);
  router.get('/main', clerkAuthMiddleware, responseCache(60), getMainAnalytics);

  return router;
};
