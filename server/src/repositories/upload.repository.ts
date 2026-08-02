import { prisma, redisClient } from '../utils';
import { PLAN_REDIS_TTL_SEC, usageRedisKey } from '../config';
import type { Prisma, VideoMetadata, PendingUploads, TranscodingMetadata, Usage, Playlist } from '../../generated/prisma/client';
import type { IUploadRepository } from '../interfaces';

export class UploadRepository implements IUploadRepository {
  async createVideoMetadata(data: Prisma.VideoMetadataUncheckedCreateInput): Promise<VideoMetadata> {
    return prisma.videoMetadata.create({
      data,
    });
  }

  async createPendingUpload(data: Prisma.PendingUploadsUncheckedCreateInput): Promise<PendingUploads> {
    return prisma.pendingUploads.create({
      data,
    });
  }

  async incrementRedisStorageUsage(userId: string, reservedBytes: number): Promise<void> {
    const rKey = usageRedisKey(userId);
    const exists = await redisClient.exists(rKey);
    if (exists) {
      await redisClient.hincrby(rKey, 'storageUsage', reservedBytes);
      void redisClient.expire(rKey, PLAN_REDIS_TTL_SEC);
    }
  }

  async deletePendingUploadsByVideoId(videoId: string): Promise<void> {
    await prisma.pendingUploads.deleteMany({
      where: { video_id: videoId },
    });
  }

  async updateVideoMetadata(id: string, data: Prisma.VideoMetadataUpdateInput): Promise<VideoMetadata> {
    return prisma.videoMetadata.update({
      where: { id },
      data,
    });
  }

  async updateVideoMetadataByTrackingId(trackingId: string, data: Prisma.VideoMetadataUpdateManyMutationInput): Promise<void> {
    await prisma.videoMetadata.updateMany({
      where: { videoTrackingId: trackingId },
      data,
    });
  }

  async getVideoMetadataByTrackingId(trackingId: string): Promise<{ id: string; user_id: string; videoSize: bigint } | null> {
    return prisma.videoMetadata.findFirst({
      where: { videoTrackingId: trackingId },
      select: {
        id: true,
        user_id: true,
        videoSize: true,
      },
    });
  }

  async createTranscodingMetadata(data: Prisma.TranscodingMetadataUncheckedCreateInput): Promise<TranscodingMetadata> {
    return prisma.transcodingMetadata.create({
      data,
    });
  }

  async getTranscodingMetadataByVideoId(videoId: string): Promise<Pick<TranscodingMetadata, 'id' | 'totalSizeBytes'> | null> {
    return prisma.transcodingMetadata.findFirst({
      where: { video_id: videoId },
      select: {
        id: true,
        totalSizeBytes: true,
      },
    });
  }

  async updateTranscodingMetadata(id: string, data: Prisma.TranscodingMetadataUpdateInput): Promise<TranscodingMetadata> {
    return prisma.transcodingMetadata.update({
      where: { id },
      data,
    });
  }

  async getUsageByUserId(userId: string): Promise<Pick<Usage, 'id' | 'storage_usage'> | null> {
    return prisma.usage.findFirst({
      where: { user_id: userId },
      select: {
        id: true,
        storage_usage: true,
      },
    });
  }

  async createUsage(data: Prisma.UsageUncheckedCreateInput): Promise<Usage> {
    return prisma.usage.create({
      data,
    });
  }

  async updateUsageStorageById(id: string, totalStorageUsage: bigint): Promise<Usage> {
    return prisma.usage.update({
      where: { id },
      data: {
        storage_usage: totalStorageUsage,
        updated_at: new Date(),
      },
    });
  }

  async setRedisStorageUsage(userId: string, totalStorageUsage: string): Promise<void> {
    const rKey = usageRedisKey(userId);
    const exists = await redisClient.exists(rKey);
    if (exists) {
      await redisClient.hset(rKey, 'storageUsage', totalStorageUsage);
      void redisClient.expire(rKey, PLAN_REDIS_TTL_SEC);
    }
  }

  async getVideosMetadata(userId: string): Promise<{
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
  }[]> {
    const videos = await prisma.videoMetadata.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailTrackingId: true,
        videoTrackingId: true,
        status: true,
        playlist_id: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const playlistIds = videos.map(v => v.playlist_id).filter(id => id != null) as string[];
    let playlists: Pick<Playlist, 'id' | 'name'>[] = [];

    if (playlistIds.length > 0) {
      playlists = await prisma.playlist.findMany({
        where: { id: { in: playlistIds } },
        select: { id: true, name: true },
      });
    }

    const playlistMap = new Map(playlists.map(p => [p.id, p.name]));

    const videoIds = videos.map(v => v.id);
    // LEFT JOIN equivalent — COALESCE(video_analytics.totalViews, 0)
    const analytics = await prisma.videoAnalytics.findMany({
      where: { video_id: { in: videoIds } },
      select: { video_id: true, totalViews: true },
    });

    const analyticsMap = new Map(analytics.map(a => [a.video_id, Number(a.totalViews)]));

    return videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailTrackingId: video.thumbnailTrackingId,
      videoTrackingId: video.videoTrackingId,
      status: video.status,
      playlist_id: video.playlist_id,
      playlist_name: video.playlist_id ? playlistMap.get(video.playlist_id) : undefined,
      created_at: video.created_at,
      totalViews: analyticsMap.get(video.id) ?? 0, // COALESCE equivalent
    }));
  }

  async getVideoMetadata(videoId: string, userId: string): Promise<{
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
  } | null> {
    const video = await prisma.videoMetadata.findUnique({
      where: {
        id: videoId,
        user_id: userId,
      },
    });

    if (!video) {
      return null;
    }

    const playlist = video.playlist_id
      ? await prisma.playlist.findUnique({ where: { id: video.playlist_id } })
      : null;

    const transcoding = await prisma.transcodingMetadata.findFirst({
      where: { video_id: videoId },
    });

    const analytics = await prisma.videoAnalytics.findUnique({
      where: { video_id: videoId },
    });

    const videoSizeNumber = Number(video.videoSize);
    const transcodingSizeNumber = transcoding ? Number(transcoding.totalSizeBytes) : 0;
    
    let minuteStreamed = 0;
    let avgViewDuration = 0;
    if (analytics) {
      minuteStreamed = Number(analytics.minute_streamed);
      avgViewDuration = analytics.average_view_duration;
    }

    const formattedMinuteStreamed = `${Math.floor(minuteStreamed / 60)}:${String(minuteStreamed % 60).padStart(2, '0')}`;

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      videoTrackingId: video.videoTrackingId,
      status: video.status,
      playlist_name: playlist?.name,
      tags: video.tags,
      videoSize: videoSizeNumber + transcodingSizeNumber,
      videoDuration: video.videoDuration,
      videoContentType: video.videoContentType,
      resolution: transcoding?.resolution?.length ? transcoding.resolution.join(", ") : null,
      created_at: video.created_at,
      updated_at: video.updated_at,
      analytics: {
        totalViews: analytics ? Number(analytics.totalViews) : 0,
        uniqueViews: analytics ? Number(analytics.uniqueViews) : 0,
        minute_streamed: formattedMinuteStreamed,
        average_view_duration: avgViewDuration,
        geo: analytics?.geo || [],
        device: analytics?.device || [],
      },
    };
  }

  async getDailyAnalytics(videoId: string, userId: string): Promise<any> {
    const video = await prisma.videoMetadata.findUnique({
      where: { id: videoId, user_id: userId },
      select: { id: true },
    });

    if (!video) {
      const { NotFoundException } = require('@nestjs/common');
      throw new NotFoundException('Video not found or access denied');
    }

    const result = await prisma.videoDailyAnalytics.findUnique({
      where: { video_id: videoId },
    });

    return result || { video_id: videoId, views_last_28_days: [] };
  }
}
