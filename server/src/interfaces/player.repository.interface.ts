import type { VideoMetadata, PlayerMetadata } from '../../generated/prisma/client';

export interface IPlayerRepository {
  getVideoMetadataByTrackingId(
    trackingId: string
  ): Promise<Pick<VideoMetadata, 'id' | 'videoTrackingId' | 'timestamps' | 'videoDuration'> | null>;
  
  getPlayerSettings(userId: string): Promise<PlayerMetadata | null>;
  upsertPlayerSettings(userId: string, settings: any): Promise<PlayerMetadata>;
}
