import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { UploadService } from '../services/upload.service';
import { UploadRepository } from '../repositories/upload.repository';
import { clerkAuthMiddleware, uploadGuard, responseCache } from '../middleware';

export const createUploadRouter = (): Router => {
  const uploadRepository = new UploadRepository();
  const uploadService = new UploadService(uploadRepository);
  const uploadController = new UploadController(uploadService);

  const router = Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB
    },
  });

  router.post('/', clerkAuthMiddleware, uploadGuard, uploadController.create);
  router.post('/complete', clerkAuthMiddleware, uploadGuard, uploadController.complete);
  router.post('/webhook', uploadController.handleWebhook);
  router.post(
    '/thumbnail',
    clerkAuthMiddleware,
    upload.single('thumbnail'),
    uploadController.uploadThumbnail,
  );
  router.patch('/toggle-public/:videoId', clerkAuthMiddleware, uploadGuard, uploadController.togglePublic);
  router.get('/get-videos-metadata', clerkAuthMiddleware, responseCache(60), uploadController.getVideosMetadata);
  router.get('/get-video-metadata/:videoId', clerkAuthMiddleware, responseCache(60), uploadController.getVideoMetadata);
  router.get('/get-daily-analytics/:videoId', clerkAuthMiddleware, responseCache(120), uploadController.getDailyAnalytics);
  return router;
};
