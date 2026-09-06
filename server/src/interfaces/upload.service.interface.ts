import type { InitialUploadDto } from '../dto/initiate.upload.dto';
import type { UploadFilePart } from '../config';
import type { VideoMetadata } from '../../generated/prisma/client';

export interface IUploadService {
  initiate(userId: string, dto: InitialUploadDto): Promise<any>;
  complete(
    userId: string,
    objectId: string,
    uploadId: string,
    key: string,
    parts: UploadFilePart[],
    videoId: string,
    plan: string,
  ): Promise<any>;
  uploadThumbnail(
    videoId: string,
    thumbnail: Express.Multer.File,
    thumbnailFileName: string,
    thumbnailContentType: string,
    thumbnailSize: number,
  ): Promise<any>;
  handleWebhook(req: any): Promise<any>;
  getVideosMetadata(userId: string): Promise<any[]>;
  getVideoMetadata(videoId: string, userId: string): Promise<any>;
  getDailyAnalytics(videoId: string, userId: string): Promise<any>;
  toggleVideoPublic(videoId: string, userId: string, isPublic: boolean): Promise<any>;
  getPublicVideoBySlug(publicSlug: string): Promise<any>;
}
