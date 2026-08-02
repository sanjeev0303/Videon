import { prisma } from '../utils/prisma';

export class BrandingRepository {
  async getWatermarkMetadata(userId: string) {
    return prisma.watermarkMetadata.findUnique({
      where: { user_id: userId },
    });
  }

  async upsertWatermarkMetadata(userId: string, data: any) {
    return prisma.watermarkMetadata.upsert({
      where: { user_id: userId },
      update: data,
      create: {
        user_id: userId,
        ...data,
      },
    });
  }
}
