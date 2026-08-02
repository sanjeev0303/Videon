import crypto from 'crypto';
import { createStorageBucket } from '@oneminutecloud/storage-bucket';
import { media } from '@oneminutecloud/media-convert';
import { appConfig, UploadFilePart } from '../config';
import type { IUploadService, IUploadRepository } from '../interfaces';
import type { InitialUploadDto } from '../dto/initiate.upload.dto';
import { AppError } from '../middleware/error.middleware';

export class UploadService implements IUploadService {
  private bucket: ReturnType<typeof createStorageBucket>;

  constructor(private readonly uploadRepository: IUploadRepository) {
    this.bucket = createStorageBucket({ apiKey: appConfig.oneMinuteCloudApiKey });
  }

  async initiate(userId: string, dto: InitialUploadDto) {
    let uploadData: any;

    try {
      uploadData = await this.bucket.initiateUpload({
        bucketId: appConfig.oneMinuteCloudBucketId,
        filename: dto.videoFileName,
        contentType: dto.videoContentType,
        size: dto.videoSize,
        duration: dto.videoDuration ?? 0,
      });
    } catch (err: any) {
      throw new AppError(
        err?.message ?? 'Failed to initiate upload with OneMinuteCloud. Please try again',
        502,
      );
    }

    const videoId = crypto.randomUUID();

    await this.uploadRepository.createVideoMetadata({
      id: videoId,
      user_id: userId,
      title: dto.title,
      description: dto.description,
      videoFileName: dto.videoFileName,
      videoContentType: dto.videoContentType,
      videoSize: dto.videoSize,
      videoDuration: dto.videoDuration,
      thumbnailFileName: dto.thumbnailFileName,
      thumbnailContentType: dto.thumbnailContentType,
      thumbnailSize: dto.thumbnailSize,
      tags: dto.tags ?? [],
      timestamps: dto.timestamps ?? [],
      playlist_id: dto.playlist && dto.playlist.trim() !== '' ? dto.playlist : null,
      generateSubtitles: dto.generateSubtitles ?? false,
      includeWatermark: dto.includeWatermark ?? false,
      status: 'PENDING',
    });

    await this.uploadRepository.createPendingUpload({
      id: crypto.randomUUID(),
      video_id: videoId,
      videoSize: dto.videoSize,
      started_at: new Date(),
    });

    const reservedBytes = dto.videoSize + dto.thumbnailSize;
    await this.uploadRepository.incrementRedisStorageUsage(userId, reservedBytes);

    return { ...uploadData, videoId };
  }

  async complete(
    userId: string,
    objectId: string,
    uploadId: string,
    key: string,
    parts: UploadFilePart[],
    videoId: string,
    plan: string,
  ) {
    console.log('[complete] objectId:', objectId, 'uploadId:', uploadId, 'key:', key);
    console.log('[complete] parts received:', JSON.stringify(parts));

    let completeUpload: any;
    try {
      completeUpload = await this.bucket.confirmUpload({
        bucketId: appConfig.oneMinuteCloudBucketId,
        objectId,
        uploadId,
        key,
        parts,
      });
    } catch (err: any) {
      console.error('[complete] confirmUpload raw error:', err?.message, err?.stack);
      throw new AppError(err.message || 'Failed to complete upload in storage', 500);
    }

    await this.uploadRepository.deletePendingUploadsByVideoId(videoId);

    const { trackingId } = await media.convert({
      apiKey: appConfig.oneMinuteCloudApiKey,
      keyname: key,
      outPutBucketId: appConfig.oneMinuteCloudTranscodingBucketId,
      outputs: plan === 'free' ? ['720p'] : ['360p', '480p', '720p', '1080p'],
      generateSubtitles: true,
      webhookUrl: appConfig.webhookUrl,
    });

    await this.uploadRepository.updateVideoMetadata(videoId, {
      status: 'PROCESSING',
      videoTrackingId: trackingId,
      updated_at: new Date(),
    });

    return completeUpload;
  }

  async uploadThumbnail(
    videoId: string,
    thumbnail: Express.Multer.File,
    thumbnailFileName: string,
    thumbnailContentType: string,
    thumbnailSize: number,
  ) {
    try {
      const result = await this.bucket.uploadFile({
        bucketId: appConfig.oneMinuteCloudBucketId,
        file: thumbnail,
        filename: thumbnailFileName,
        contentType: thumbnailContentType,
        size: thumbnailSize,
      });

      await this.uploadRepository.updateVideoMetadata(videoId, {
        thumbnailTrackingId: result.thumbnailKey,
        updated_at: new Date(),
      });

      return { thumbnailKey: result.thumbnailKey };
    } catch (error: any) {
      console.log(`[uploadThumbnail] ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async handleWebhook(req: any) {
    try {
      const apiKey = appConfig.oneMinuteCloudApiKey;
      if (!apiKey) {
        throw new AppError('API Key is required!', 401);
      }

      await media.verifyWebhook({
        apiKey,
        headers: req.headers,
        body: req.body,
      });

      const { jobId: trackingId, event } = req.body;
      if (!trackingId) {
        throw new AppError('Invalid payload', 401);
      }

      const metadata = await media.getMetadata({
        apiKey: appConfig.oneMinuteCloudApiKey,
        trackingId,
      });

      await this.uploadRepository.updateVideoMetadataByTrackingId(trackingId, {
        status: event === 'job.completed' ? 'READY' : 'FAILED',
        updated_at: new Date(),
      });

      const videoRow = await this.uploadRepository.getVideoMetadataByTrackingId(trackingId);

      if (!videoRow) {
        throw new Error(`No video found for trackingId: ${trackingId}`);
      }

      const existingTranscoding = await this.uploadRepository.getTranscodingMetadataByVideoId(videoRow.id);

      if (existingTranscoding) {
        await this.uploadRepository.updateTranscodingMetadata(existingTranscoding.id, {
          fileCount: metadata.fileCount,
          totalSizeBytes: metadata.totalSizeBytes,
          resolution: metadata.resolution,
          status: event === 'job.completed' ? 'active' : 'failed',
        });
      } else {
        await this.uploadRepository.createTranscodingMetadata({
          id: crypto.randomUUID(),
          video_id: videoRow.id,
          fileCount: metadata.fileCount,
          totalSizeBytes: metadata.totalSizeBytes,
          resolution: metadata.resolution,
          status: event === 'job.completed' ? 'active' : 'failed',
        });
      }

      const totalStorageUsage = BigInt(videoRow.videoSize) + BigInt(metadata.totalSizeBytes);
      const previousTotalStorageUsage = existingTranscoding
        ? BigInt(videoRow.videoSize) + BigInt(existingTranscoding.totalSizeBytes ?? 0)
        : 0n;
      const usageDelta = totalStorageUsage - previousTotalStorageUsage;

      const usageRow = await this.uploadRepository.getUsageByUserId(videoRow.user_id);

      const updatedStorageUsage = (usageRow?.storage_usage ?? 0n) + usageDelta;
      const finalStorageUsage = updatedStorageUsage < 0n ? 0n : updatedStorageUsage;

      if (usageRow) {
        await this.uploadRepository.updateUsageStorageById(usageRow.id, finalStorageUsage);
      } else {
        await this.uploadRepository.createUsage({
          user_id: videoRow.user_id,
          storage_usage: finalStorageUsage,
        });
      }

      await this.uploadRepository.setRedisStorageUsage(videoRow.user_id, finalStorageUsage.toString());

      return { recevied: true };
    } catch (error: any) {
      console.log(`[handleWebhook] ${error.message}`, error?.stack);
      throw error;
    }
  }

  async getVideosMetadata(userId: string) {
    return this.uploadRepository.getVideosMetadata(userId);
  }

  async getVideoMetadata(videoId: string, userId: string) {
    return this.uploadRepository.getVideoMetadata(videoId, userId);
  }

  async getDailyAnalytics(videoId: string, userId: string) {
    return this.uploadRepository.getDailyAnalytics(videoId, userId);
  }
}
