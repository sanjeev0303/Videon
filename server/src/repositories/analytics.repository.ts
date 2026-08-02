import { prisma } from '../utils/prisma';
import { redisClient } from '../utils/redis';

export interface AggregatedData {
  totalViews: number;
  uniqueViewsCount: number;
  minutesStreamed: number;
  geos: Set<string>;
  geoViews: Map<string, number>;
  devices: Set<string>;
}

export class AnalyticsRepository {
  async flushAnalytics(aggregationMap: Map<string, AggregatedData>) {
    if (aggregationMap.size === 0) return;

    const geoByUser = new Map<string, Map<string, number>>();
    // Track per-user event counts for platform_analytics
    const eventCountByUser = new Map<string, number>();

    for (const [videoId, data] of aggregationMap) {
      const minutesStreamedInt = Math.round(data.minutesStreamed);
      const newGeos = Array.from(data.geos);
      const newDevices = Array.from(data.devices);

      // ─── 1. video_analytics ───────────────────────────────────────────────
      try {
        const existing = await prisma.videoAnalytics.findUnique({
          where: { video_id: videoId },
        });

        if (existing) {
          const totalViews = Number(existing.totalViews) + data.totalViews;
          const totalMinutes = Number(existing.minute_streamed) + minutesStreamedInt;
          const avgDuration = totalViews > 0 ? totalMinutes / totalViews : 0;
          const mergedGeos = Array.from(new Set([...existing.geo, ...newGeos]));
          const mergedDevices = Array.from(new Set([...existing.device, ...newDevices]));

          await prisma.videoAnalytics.update({
            where: { video_id: videoId },
            data: {
              totalViews: { increment: data.totalViews },
              uniqueViews: { increment: data.uniqueViewsCount },
              minute_streamed: { increment: minutesStreamedInt },
              average_view_duration: avgDuration,
              geo: mergedGeos,
              device: mergedDevices,
              updated_at: new Date(),
            },
          });
        } else {
          await prisma.videoAnalytics.create({
            data: {
              video_id: videoId,
              totalViews: data.totalViews,
              uniqueViews: data.uniqueViewsCount,
              minute_streamed: minutesStreamedInt,
              average_view_duration:
                data.totalViews > 0 ? data.minutesStreamed / data.totalViews : 0,
              geo: newGeos,
              device: newDevices,
            },
          });
        }
      } catch (e: any) {
        console.error(`[Analytics] video_analytics flush failed for ${videoId}:`, e?.message);
      }

      // ─── 2. Resolve user_id from video_metadata ───────────────────────────
      let userId: string | undefined;
      try {
        const video = await prisma.videoMetadata.findUnique({
          where: { id: videoId },
          select: { user_id: true },
        });
        userId = video?.user_id ?? undefined;
      } catch (e: any) {
        console.error(`[Analytics] videoMetadata lookup failed for ${videoId}:`, e?.message);
      }

      // ─── 3. usage (upsert — avoids P2025 when row doesn't exist yet) ──────
      if (userId) {
        const deltaSeconds = Math.round(data.minutesStreamed * 60);
        try {
          await prisma.usage.upsert({
            where: { user_id: userId },
            update: {
              minutes_streamed: { increment: minutesStreamedInt },
              updated_at: new Date(),
            },
            create: {
              user_id: userId,
              minutes_streamed: BigInt(minutesStreamedInt),
              storage_usage: 0n,
              storage_limit: 0n,
              minutes_streamed_limit: 0n,
            },
          });
        } catch (e: any) {
          console.error(`[Analytics] usage upsert failed for ${userId}:`, e?.message);
        }

        // Redis usage cache update
        try {
          const rKey = `usage:${userId}`;
          const exists = await redisClient.exists(rKey);
          if (exists) {
            await redisClient.hincrby(rKey, 'minutesStreamed', deltaSeconds);
            await redisClient.expire(rKey, 86400);
          }
        } catch (e: any) {
          console.error(`[Analytics] Redis usage update failed for ${userId}:`, e?.message);
        }

        // Accumulate geo views per user
        if (data.geoViews.size > 0) {
          const userGeo = geoByUser.get(userId) ?? new Map<string, number>();
          for (const [country, views] of data.geoViews) {
            userGeo.set(country, (userGeo.get(country) ?? 0) + views);
          }
          geoByUser.set(userId, userGeo);
        }

        // Accumulate event count for platform_analytics
        const currentCount = eventCountByUser.get(userId) ?? 0;
        eventCountByUser.set(userId, currentCount + data.totalViews);
      }

      // ─── 4. video_daily_analytics ─────────────────────────────────────────
      try {
        const today = new Date().toISOString().split('T')[0];
        const existingDaily = await prisma.videoDailyAnalytics.findUnique({
          where: { video_id: videoId },
        });

        if (existingDaily) {
          const viewsData: { date: string; views: number }[] = Array.isArray(
            existingDaily.views_last_28_days,
          )
            ? [...(existingDaily.views_last_28_days as any[])]
            : [];

          const dateIndex = viewsData.findIndex((d) => d.date === today);
          if (dateIndex !== -1) {
            viewsData[dateIndex].views += data.totalViews;
          } else {
            viewsData.push({ date: today, views: data.totalViews });
          }

          await prisma.videoDailyAnalytics.update({
            where: { video_id: videoId },
            data: {
              views_last_28_days: viewsData.slice(-28),
              updated_at: new Date(),
            },
          });
        } else {
          await prisma.videoDailyAnalytics.create({
            data: {
              video_id: videoId,
              views_last_28_days: [{ date: today, views: data.totalViews }],
            },
          });
        }
      } catch (e: any) {
        console.error(`[Analytics] video_daily_analytics flush failed for ${videoId}:`, e?.message);
      }
    }

    // ─── 5. geo_analytics ─────────────────────────────────────────────────
    for (const [userId, geoCounts] of geoByUser) {
      try {
        const existing = await prisma.geoAnalytics.findUnique({
          where: { user_id: userId },
        });

        const merged = new Map<string, number>();
        const existingGeo = Array.isArray(existing?.geo)
          ? (existing?.geo as { country: string; views: number }[])
          : [];

        for (const row of existingGeo) {
          if (!row?.country) continue;
          merged.set(row.country, (merged.get(row.country) ?? 0) + (row.views ?? 0));
        }
        for (const [country, views] of geoCounts) {
          if (!country) continue;
          merged.set(country, (merged.get(country) ?? 0) + views);
        }

        const mergedGeo = Array.from(merged, ([country, views]) => ({ country, views })).sort(
          (a, b) => b.views - a.views,
        );

        if (existing) {
          await prisma.geoAnalytics.update({
            where: { user_id: userId },
            data: { geo: mergedGeo, updated_at: new Date() },
          });
        } else {
          await prisma.geoAnalytics.create({
            data: { user_id: userId, geo: mergedGeo },
          });
        }
      } catch (e: any) {
        console.error(`[Analytics] geo_analytics flush failed for ${userId}:`, e?.message);
      }
    }

    // ─── 6. platform_analytics ────────────────────────────────────────────
    for (const [userId, totalEvents] of eventCountByUser) {
      try {
        const existing = await prisma.platformAnalytics.findFirst({
          where: { user_id: userId },
        });

        if (existing) {
          await prisma.platformAnalytics.update({
            where: { id: existing.id },
            data: {
              totalRequests: { increment: totalEvents },
              updated_at: new Date(),
            },
          });
        } else {
          await prisma.platformAnalytics.create({
            data: {
              user_id: userId,
              totalRequests: BigInt(totalEvents),
            },
          });
        }
      } catch (e: any) {
        console.error(`[Analytics] platform_analytics flush failed for ${userId}:`, e?.message);
      }
    }
  }
}

export const analyticsRepository = new AnalyticsRepository();
