import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { UploadService } from '../services/upload.service';
import { UploadRepository } from '../repositories/upload.repository';

export const createPublicRouter = (): Router => {
  const uploadRepository = new UploadRepository();
  const uploadService = new UploadService(uploadRepository);
  const uploadController = new UploadController(uploadService);

  const router = Router();

  // Deliberately has NO auth middleware and NO playerGuard: the slug itself is
  // the access secret, and the repository only resolves rows that are public
  // and READY.
  router.get('/videos/:publicSlug', uploadController.getPublicVideo);

  return router;
};