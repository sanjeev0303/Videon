import { Router } from 'express';
import { ApiKeyController } from '../controllers';
import { ApiKeyService } from '../services';
import { ApiKeyRepository } from '../repositories';

import { clerkAuthMiddleware } from '../middleware';

export const createApiKeyRouter = (): Router => {
  const apiKeyRepository = new ApiKeyRepository();
  const apiKeyService = new ApiKeyService(apiKeyRepository);
  const apiKeyController = new ApiKeyController(apiKeyService);

  const apiKeyRouter = Router();
  
  // Apply Clerk middleware to all API key routes
  apiKeyRouter.use(clerkAuthMiddleware);

  apiKeyRouter.post('/', apiKeyController.create);
  apiKeyRouter.get('/', apiKeyController.list);
  apiKeyRouter.post('/validate', apiKeyController.validate);
  apiKeyRouter.get('/:id', apiKeyController.lastUsed);
  apiKeyRouter.delete('/:id', apiKeyController.delete);
  apiKeyRouter.post('/:id/regenerate', apiKeyController.regenerate);

  return apiKeyRouter;
};
