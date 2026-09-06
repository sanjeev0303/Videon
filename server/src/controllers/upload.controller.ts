import type { Request, Response } from 'express';
import type { IUploadService } from '../interfaces/upload.service.interface';
import type { InitialUploadDto } from '../dto/initiate.upload.dto';
import type { UploadFilePart, PlanTier } from '../config';
import { invalidateResponseCache } from '../utils';

export class UploadController {
  constructor(private readonly uploadService: IUploadService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: InitialUploadDto = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.uploadService.initiate(userId, dto);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error initiating upload:', error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
  };

  complete = async (req: Request & { plan?: string }, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { objectId, uploadId, key, parts, videoId } = req.body as {
        objectId: string;
        uploadId: string;
        key: string;
        parts: UploadFilePart[];
        videoId: string;
      };

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const plan = req.plan || 'free';
      const result = await this.uploadService.complete(
        userId,
        objectId,
        uploadId,
        key,
        parts,
        videoId,
        plan
      );
      void invalidateResponseCache(userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error completing upload:', error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
  };

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.uploadService.handleWebhook(req);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(401).json({ error: 'Invalid webhook' });
    }
  };

  uploadThumbnail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId, thumbnailFileName, thumbnailContentType, thumbnailSize } = req.body;
      const thumbnail = req.file;
      const userId = req.user?.id;

      if (!thumbnail || !thumbnailContentType || !thumbnailFileName || !thumbnailSize) {
        res.status(400).json({ error: 'Thumbnail file is required!' });
        return;
      }

      const result = await this.uploadService.uploadThumbnail(
        videoId,
        thumbnail,
        thumbnailFileName,
        thumbnailContentType,
        Number(thumbnailSize)
      );
      if (userId) {
        void invalidateResponseCache(userId);
      }
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
  };

  getVideosMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.uploadService.getVideosMetadata(userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error getting videos metadata:', error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
  };

  getVideoMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { videoId } = req.params;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.uploadService.getVideoMetadata(videoId as string, userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error getting video metadata:', error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
  };

  togglePublic = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { videoId } = req.params;
      const { isPublic } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (typeof isPublic !== 'boolean') {
        res.status(400).json({ error: 'isPublic must be a boolean' });
        return;
      }

      const result = await this.uploadService.toggleVideoPublic(videoId as string, userId, isPublic);
      void invalidateResponseCache(userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error toggling public status:', error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
  };

  getPublicVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { publicSlug } = req.params;

      // Slug resolution is intentionally unauthenticated: the slug itself is
      // the access secret. The service only returns public + ready videos.
      const result = await this.uploadService.getPublicVideoBySlug(publicSlug as string);
      if (!result) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error getting public video:', error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
  };

  getDailyAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { videoId } = req.params;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.uploadService.getDailyAnalytics(videoId as string, userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error getting daily analytics:', error);
      // Prisma NotFoundException equivalence or custom error status check
      if (error.message === 'Video not found or access denied') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
      }
    }
  };
}
