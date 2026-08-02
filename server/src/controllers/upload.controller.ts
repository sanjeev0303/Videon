import type { Request, Response } from 'express';
import type { IUploadService } from '../interfaces/upload.service.interface';
import type { InitialUploadDto } from '../dto/initiate.upload.dto';
import type { UploadFilePart, PlanTier } from '../config';

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
