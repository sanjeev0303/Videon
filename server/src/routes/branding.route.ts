import { Router } from 'express';
import multer from 'multer';
import { BrandingController } from '../controllers/branding.controller';
import { BrandingService } from '../services/branding.service';
import { BrandingRepository } from '../repositories/branding.repository';
import { clerkAuthMiddleware } from '../middleware/clerk.middleware';
import { responseCache } from '../middleware';

export const createBrandingRouter = (): Router => {
  const router = Router();
  
  const brandingRepository = new BrandingRepository();
  const brandingService = new BrandingService(brandingRepository);
  const brandingController = new BrandingController(brandingService);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  });

  router.use(clerkAuthMiddleware);

  router.get('/watermark', responseCache(60), brandingController.getWatermark);
  router.post('/watermark', brandingController.updateWatermark);
  router.post('/watermark/upload', upload.single('file'), brandingController.uploadWatermark);

  return router;
};
