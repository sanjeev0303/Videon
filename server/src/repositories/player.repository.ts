import { prisma } from '../utils/prisma';
import type { IPlayerRepository } from '../interfaces';

export class PlayerRepository implements IPlayerRepository {
  async getVideoMetadataByTrackingId(trackingId: string) {
    return prisma.videoMetadata.findFirst({
      where: {
        videoTrackingId: trackingId,
      },
      select: {
        id: true,
        videoTrackingId: true,
        timestamps: true,
        videoDuration: true,
      },
    });
  }

  async getPlayerSettings(userId: string) {
    return prisma.playerMetadata.findUnique({
      where: { user_id: userId },
    });
  }

  async upsertPlayerSettings(userId: string, settings: any) {
    return prisma.playerMetadata.upsert({
      where: { user_id: userId },
      update: { settings },
      create: {
        user_id: userId,
        settings,
      },
    });
  }
}
