import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { JSONCodec } from 'nats';
import { AnalyticsEventDto } from '../dto/analytics.dto';
import { appConfig } from '../config';
import { natsService } from './nats.service';
import { prisma } from '../utils/prisma';

class AnalyticsService {
  private sc = JSONCodec();

  async handleEvent(dto: AnalyticsEventDto, ip: string, userAgent: string) {
    let payload: any;

    try {
      payload = jwt.verify(dto.token, appConfig.analyticsJwtSecret);
    } catch (error) {
      throw new Error('Invalid analytics token');
    }

    if (payload.purpose !== 'playback_analytics') {
      throw new Error('Invalid token purpose');
    }

    const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');

    const eventData = {
      ...dto,
      videoId: payload.videoId,
      sessionId: payload.sessionId,
      videoTrackingId: payload.videoTrackingId,
      ip: hashedIp,
      geo: dto.geo || 'Global',
      userAgent: userAgent || 'Unknown',
      isUnique: dto.isUnique || false,
      timestamp: new Date().toISOString(),
    };

    const js = natsService.getJetStreamClient();
    if (!js) {
        console.warn('NATS JetStream client not available, skipping event publish');
        return { success: false };
    }

    await js.publish(
      `videon.analytics.playback.${payload.videoId}`,
      this.sc.encode(eventData)
    );

    return { success: true };
  }

  private parseRangeDays(range?: string) {
    if (range === '7d') return 7;
    if (range === '14d') return 14;
    return 30;
  }

  private isoDayAgo(daysAgo: number) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }

  async getAnalytics(userId: string) {
    const usageRow = await prisma.usage.findUnique({
      where: { user_id: userId }
    });

    const minutesStreamedSeconds = usageRow?.minutes_streamed ?? 0n;
    const minutesStreamedLimitMinutes = usageRow?.minutes_streamed_limit ?? 0n;

    const userVideos = await prisma.videoMetadata.findMany({
      where: { user_id: userId },
      select: { id: true, title: true }
    });
    const videoIds = userVideos.map(v => v.id);

    const analyticsData = await prisma.videoAnalytics.findMany({
      where: { video_id: { in: videoIds } }
    });

    const totalRequests = analyticsData.reduce((acc, curr) => acc + Number(curr.totalViews || 0), 0);

    const dailyRows = await prisma.videoDailyAnalytics.findMany({
      where: { video_id: { in: videoIds } }
    });

    const dailyTotals = new Map<string, number>();

    for (const row of dailyRows) {
      const days = (row.views_last_28_days as { date: string; views: number }[]) || [];
      for (const d of days) {
        if (!d?.date) continue;
        dailyTotals.set(
          d.date,
          (dailyTotals.get(d.date) ?? 0) + (d.views ?? 0),
        );
      }
    }

    let last7 = 0;
    let prev7 = 0;

    for (let i = 0; i < 7; i++) {
      last7 += dailyTotals.get(this.isoDayAgo(i)) ?? 0;
    }
    for (let i = 7; i < 14; i++) {
      prev7 += dailyTotals.get(this.isoDayAgo(i)) ?? 0;
    }

    const avgPerDay = last7 / 7;
    const growthPct = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : last7 > 0 ? 100 : 0;

    const geoRow = await prisma.geoAnalytics.findUnique({
      where: { user_id: userId }
    });

    const topVideosData = analyticsData
      .sort((a, b) => Number(b.totalViews) - Number(a.totalViews))
      .slice(0, 5)
      .map(v => {
        const mv = userVideos.find(uv => uv.id === v.video_id);
        return {
          id: v.video_id,
          title: mv?.title || 'Unknown',
          views: Number(v.totalViews)
        };
      });

    const minutesUsed = Number(minutesStreamedSeconds) / 60;
    const minutesLimit = Number(minutesStreamedLimitMinutes);
    const minutesPct = minutesLimit > 0 ? Math.min(1, Math.max(0, minutesUsed / minutesLimit)) : 0;

    const storageUsed = Number(usageRow?.storage_usage ?? 0);
    const storageLimit = Number(usageRow?.storage_limit ?? 0);
    const storagePct = storageLimit > 0 ? Math.min(1, Math.max(0, storageUsed / storageLimit)) : 0;

    const overallUsagePct = Number((((minutesPct + storagePct) / 2) * 100).toFixed(1));

    return {
      minutesStreamed: {
        used_seconds: Number(minutesStreamedSeconds),
        used_minutes: minutesUsed,
        limit: minutesLimit,
      },
      storageUsed: {
        used: storageUsed,
        limit: storageLimit,
      },
      overallUsagePct,
      totalRequests,
      requestStats: {
        avgPerDay: Number(avgPerDay.toFixed(1)),
        growthPct: Number(growthPct.toFixed(1)),
        windowDays: 7,
      },
      visitorCountries: (geoRow?.geo as { country: string; views: number }[]) ?? [],
      topVideos: topVideosData,
    };
  }

  async getMainAnalytics(userId: string, range?: string) {
    const rangeDays = this.parseRangeDays(range);

    const videos = await prisma.videoMetadata.findMany({
      where: { user_id: userId },
      select: { id: true, title: true }
    });
    const videoIds = videos.map(v => v.id);

    const analyticsData = await prisma.videoAnalytics.findMany({
      where: { video_id: { in: videoIds } }
    });
    
    const dailyAnalytics = await prisma.videoDailyAnalytics.findMany({
      where: { video_id: { in: videoIds } }
    });

    let totalViews = 0;
    let uniqueViewers = 0;
    let watchTimeSeconds = 0;

    const dailyTotals = new Map<string, number>();
    const deviceCounts = new Map<string, number>();

    const mergedData = videos.map(v => {
      const a = analyticsData.find(ad => ad.video_id === v.id);
      const d = dailyAnalytics.find(da => da.video_id === v.id);
      return {
        ...v,
        totalViews: Number(a?.totalViews ?? 0),
        uniqueViews: Number(a?.uniqueViews ?? 0),
        // minute_streamed stores minutes in DB — convert to seconds for the UI
        watchSeconds: Number(a?.minute_streamed ?? 0) * 60,
        // average_view_duration is stored in minutes — convert to seconds for the UI
        avgDurationSeconds: (a?.average_view_duration ?? 0) * 60,
        viewsLast28Days: (d?.views_last_28_days as { date: string; views: number }[]) ?? [],
        devices: (a?.device ?? []) as string[],
      };
    });

    for (const v of mergedData) {
      totalViews += v.totalViews;
      uniqueViewers += v.uniqueViews;
      watchTimeSeconds += v.watchSeconds;

      for (const d of v.viewsLast28Days) {
        if (!d?.date) continue;
        dailyTotals.set(
          d.date,
          (dailyTotals.get(d.date) ?? 0) + (d.views ?? 0),
        );
      }

      for (const device of v.devices) {
        const ua = device.toLowerCase();
        let category = 'Other';
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
          category = 'Mobile';
        } else if (ua.includes('tablet')) {
          category = 'Tablet';
        } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox') || ua.includes('edge') || ua.includes('desktop')) {
          category = 'Desktop';
        }
        deviceCounts.set(category, (deviceCounts.get(category) ?? 0) + 1);
      }
    }

    const avgDurationSeconds = totalViews > 0 ? watchTimeSeconds / totalViews : 0;

    let lastRange = 0;
    let prevRange = 0;

    for (let i = 0; i < rangeDays; i++) {
      lastRange += dailyTotals.get(this.isoDayAgo(i)) ?? 0;
    }
    for (let i = rangeDays; i < rangeDays * 2; i++) {
      prevRange += dailyTotals.get(this.isoDayAgo(i)) ?? 0;
    }

    const totalViewsChangePct = prevRange > 0
      ? ((lastRange - prevRange) / prevRange) * 100
      : lastRange > 0
      ? 100
      : 0;

    const viewsOverTime = Array.from({ length: rangeDays }, (_, idx) => {
      const daysAgo = rangeDays - 1 - idx;
      const date = this.isoDayAgo(daysAgo);
      return {
        date,
        views: dailyTotals.get(date) ?? 0,
      };
    });

    const dateSet = new Set<string>();
    for (let i = 0; i < rangeDays; i++) dateSet.add(this.isoDayAgo(i));

    const topVideosMapped = mergedData.map((v) => {
      let rangeViews = 0;
      for (const d of v.viewsLast28Days) {
        if (dateSet.has(d.date)) rangeViews += d.views ?? 0;
      }

      // Fall back to cumulative totalViews when no daily breakdown exists for the range
      const effectiveViews = rangeViews > 0 ? rangeViews : v.totalViews;

      return {
        id: v.id,
        title: v.title,
        views: effectiveViews,
        watchTimeSeconds: v.watchSeconds,
        avgDurationSeconds: v.avgDurationSeconds,
      };
    });

    // Show videos that have any views; if none do, show all (so UI is never empty)
    const withViews = topVideosMapped.filter(v => v.views > 0);
    const topVideos = (withViews.length > 0 ? withViews : topVideosMapped)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const totalDevices = Array.from(deviceCounts.values()).reduce((a, b) => a + b, 0);
    const deviceBreakdown = Array.from(deviceCounts.entries()).map(([name, count]) => ({
      name,
      value: totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0,
    }));

    return {
      range: rangeDays,
      overview: {
        totalViews,
        totalViewsChangePct: Number(totalViewsChangePct.toFixed(1)),
        watchTimeSeconds,
        uniqueViewers,
        avgDurationSeconds: Number(avgDurationSeconds.toFixed(2)),
      },
      viewsOverTime,
      topVideos,
      deviceBreakdown,
    };
  }
}

export const analyticsService = new AnalyticsService();
