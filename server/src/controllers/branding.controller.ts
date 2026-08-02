import { Request, Response, NextFunction } from 'express';
import { BrandingService } from '../services/branding.service';

export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  public getWatermark = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const data = await this.brandingService.getWatermarkSettings(userId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public updateWatermark = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const data = await this.brandingService.updateWatermarkSettings(userId, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public uploadWatermark = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'Missing file' });
      }
      const data = await this.brandingService.uploadWatermark(userId, req.file);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
