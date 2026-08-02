import crypto from 'crypto';
import { createStorageBucket } from '@oneminutecloud/storage-bucket';
import { appConfig } from '../config';
import { AppError } from '../middleware/error.middleware';
import { getPlan } from '../middleware/upload.middleware';
import { PlanTier } from '../config';
import { BrandingRepository } from '../repositories/branding.repository';

const POSITION_VALUES = new Set([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
]);

type WatermarkSettings = {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fileKey: string | null;
  lastUploadAt: string | null;
  nextUploadAvailableAt: string | null;
  canCustomize: boolean;
  plan: string;
};

export class BrandingService {
  private bucket: ReturnType<typeof createStorageBucket>;

  constructor(private readonly brandingRepository: BrandingRepository) {
    this.bucket = createStorageBucket({
      apiKey: appConfig.oneMinuteCloudApiKey,
    });
  }

  async getWatermarkSettings(userId: string): Promise<WatermarkSettings> {
    const planInfo = await getPlan(userId);
    const planTier = planInfo.name;
    const canCustomize = planTier !== PlanTier.FREE;

    const record = await this.brandingRepository.getWatermarkMetadata(userId);
    const enabled = canCustomize ? Boolean(record?.enabled ?? false) : true;
    const position = (record?.position ?? 'bottom-right') as WatermarkSettings['position'];
    const opacity = Number(record?.opacity ?? 50);
    const fileKey = (record?.file_key ?? null) as string | null;

    const lastUploadAt = record?.last_upload_at
      ? new Date(record.last_upload_at).toISOString()
      : null;

    const nextUploadAvailableAt = record?.last_upload_at
      ? new Date(new Date(record.last_upload_at).getTime() + 60 * 60 * 1000).toISOString()
      : null;

    return {
      enabled,
      position: POSITION_VALUES.has(position) ? position : 'bottom-right',
      opacity: Number.isFinite(opacity) ? Math.max(0, Math.min(100, opacity)) : 50,
      fileKey,
      lastUploadAt,
      nextUploadAvailableAt,
      canCustomize,
      plan: planTier,
    };
  }

  async updateWatermarkSettings(userId: string, body: any): Promise<WatermarkSettings> {
    const planInfo = await getPlan(userId);
    if (planInfo.name === PlanTier.FREE) {
      throw new AppError('Free plans cannot customize watermarks.', 403);
    }

    const updateData: any = { updated_at: new Date() };
    if (typeof body.enabled === 'boolean') updateData.enabled = body.enabled;
    if (POSITION_VALUES.has(body.position)) updateData.position = body.position;
    if (typeof body.opacity === 'number' && Number.isFinite(body.opacity)) {
      updateData.opacity = Math.max(0, Math.min(100, body.opacity));
    }

    await this.brandingRepository.upsertWatermarkMetadata(userId, updateData);
    return this.getWatermarkSettings(userId);
  }

  async uploadWatermark(userId: string, file: Express.Multer.File) {
    if (!file) throw new AppError('Missing file', 400);
    const contentType = file.mimetype || '';
    const isPng = contentType === 'image/png';
    const isSvg = contentType === 'image/svg+xml';
    if (!isPng && !isSvg) {
      throw new AppError('Only PNG or SVG is supported', 400);
    }

    const record = await this.brandingRepository.getWatermarkMetadata(userId);
    if (record?.last_upload_at) {
      const last = new Date(record.last_upload_at).getTime();
      const next = last + 60 * 60 * 1000;
      if (Date.now() < next) {
        throw new AppError('You can upload a new watermark once per hour.', 403);
      }
    }

    const ext = isPng ? 'png' : 'svg';
    const filename = `watermarks/${userId}/${crypto.randomUUID()}.${ext}`;
    
    const uploaded = await this.bucket.uploadFile({
      bucketId: appConfig.oneMinuteCloudTranscodingBucketId,
      file,
      filename,
      contentType,
      size: file.size,
    });

    const fileKey = uploaded.thumbnailKey;

    await this.brandingRepository.upsertWatermarkMetadata(userId, {
      enabled: true,
      file_key: fileKey,
      last_upload_at: new Date(),
      updated_at: new Date(),
    });

    return this.getWatermarkSettings(userId);
  }
}
