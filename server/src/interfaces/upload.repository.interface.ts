import type { Prisma, VideoMetadata, PendingUploads, TranscodingMetadata, Usage, Playlist } from '../../generated/prisma/client';

export interface IUploadRepository {
  createVideoMetadata(data: Prisma.VideoMetadataUncheckedCreateInput): Promise<VideoMetadata>;
  createPendingUpload(data: Prisma.PendingUploadsUncheckedCreateInput): Promise<PendingUploads>;
  incrementRedisStorageUsage(userId: string, reservedBytes: number): Promise<void>;
  
  deletePendingUploadsByVideoId(videoId: string): Promise<void>;
  updateVideoMetadata(id: string, data: Prisma.VideoMetadataUpdateInput): Promise<VideoMetadata>;
  
  updateVideoMetadataByTrackingId(trackingId: string, data: Prisma.VideoMetadataUpdateManyMutationInput): Promise<void>;
  getVideoMetadataByTrackingId(trackingId: string): Promise<{ id: string; user_id: string; videoSize: bigint } | null>;
  createTranscodingMetadata(data: Prisma.TranscodingMetadataUncheckedCreateInput): Promise<TranscodingMetadata>;
  getTranscodingMetadataByVideoId(videoId: string): Promise<Pick<TranscodingMetadata, 'id' | 'totalSizeBytes'> | null>;
  updateTranscodingMetadata(id: string, data: Prisma.TranscodingMetadataUpdateInput): Promise<TranscodingMetadata>;

  getUsageByUserId(userId: string): Promise<Pick<Usage, 'id' | 'storage_usage'> | null>;
  createUsage(data: Prisma.UsageUncheckedCreateInput): Promise<Usage>;
  updateUsageStorageById(id: string, totalStorageUsage: bigint): Promise<Usage>;
  setRedisStorageUsage(userId: string, totalStorageUsage: string): Promise<void>;
  
  getVideosMetadata(userId: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    thumbnailTrackingId: string | null;
    videoTrackingId: string | null;
    status: string;
    playlist_id: string | null;
    playlist_name?: string;
    created_at: Date;
    totalViews: number;
  }[]>;

  getVideoMetadata(videoId: string, userId: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    videoTrackingId: string | null;
    status: string;
    playlist_name?: string;
    tags: string[];
    videoSize: number;
    videoDuration: number | null;
    videoContentType: string | null;
    resolution: string | null;
    created_at: Date;
    updated_at: Date;
    analytics: {
      totalViews: number;
      uniqueViews: number;
      minute_streamed: string;
      average_view_duration: number;
      geo: string[];
      device: string[];
    };
  } | null>;
  getDailyAnalytics(videoId: string, userId: string): Promise<any>;
}
