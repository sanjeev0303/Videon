import { JSONCodec } from 'nats';
import { natsService } from '../services';
import { analyticsRepository, AggregatedData } from '../repositories';

export class AnalyticsWorkerService {
  private sc = JSONCodec();
  private aggregationMap = new Map<string, AggregatedData>();
  private lastHeartbeatTime = new Map<string, number>();
  private sessionViewCounted = new Set<string>();
  
  private flushTimer: NodeJS.Timeout | null = null;
  private isConsuming = false;

  async start() {
    console.log('Analytics Worker Starting...');
    setTimeout(() => this.consumeEvents(), 5000);
    this.flushTimer = setInterval(() => this.flushToDb(), 30000);
  }

  async stop() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flushToDb();
  }

  private async consumeEvents() {
    if (this.isConsuming) return;
    this.isConsuming = true;

    const js = natsService.getJetStreamClient();
    if (!js) {
      console.error('JetStream client not available');
      this.isConsuming = false;
      setTimeout(() => this.consumeEvents(), 5000);
      return;
    }

    try {
      const consumer = await js.consumers.get(
        'videon_playback_events',
        'videon_analytics_worker',
      );

      const messages = await consumer.consume();
      console.log('Worker listening for playback events using modern pull consumer API');

      (async () => {
        try {
          for await (const m of messages) {
            try {
              const data = this.sc.decode(m.data) as any;
              this.processEvent(data);
              m.ack();
            } catch (error) {
              console.error('Error processing individual message', error);
            }
          }
        } catch (error) {
          console.error('Message iterator error', error);
          this.isConsuming = false;
          setTimeout(() => this.consumeEvents(), 10000);
        }
      })();
    } catch (e) {
      console.error(
        'Failed to get or consume from JetStream consumer. If this is a "push consumer not supported" error, please delete the existing consumer or use a different durable name.',
        e,
      );
      this.isConsuming = false;
      setTimeout(() => this.consumeEvents(), 10000);
    }
  }

  private processEvent(data: any) {
    const {
      videoId,
      sessionId,
      event,
      currentTime,
      ip,
      userAgent,
      geo,
      isUnique,
      timestamp,
    } = data;

    const currentServerTime = new Date(timestamp).getTime();

    if (!this.aggregationMap.has(videoId)) {
      this.aggregationMap.set(videoId, {
        totalViews: 0,
        uniqueViewsCount: 0,
        minutesStreamed: 0,
        geos: new Set(),
        geoViews: new Map(),
        devices: new Set(),
      });
    }

    const agg = this.aggregationMap.get(videoId)!;

    if (currentTime >= 3 && !this.sessionViewCounted.has(sessionId)) {
      this.sessionViewCounted.add(sessionId);
      agg.totalViews++;
      if (isUnique) {
        agg.uniqueViewsCount++;
      }
    }

    if (geo) {
      agg.geos.add(geo);
      agg.geoViews.set(geo, (agg.geoViews.get(geo) ?? 0) + 1);
    }

    const lastServerTime = this.lastHeartbeatTime.get(sessionId);
    const shouldCleanup = event === 'pause' || event === 'seek' || event === 'ended';

    if (lastServerTime !== undefined) {
      const gapSeconds = (currentServerTime - lastServerTime) / 1000;

      if (gapSeconds > 0 && gapSeconds <= 20) {
        agg.minutesStreamed += gapSeconds / 60;
      }
    }

    if (shouldCleanup) {
      this.lastHeartbeatTime.delete(sessionId);
    } else if (lastServerTime !== undefined) {
      const gapSeconds = (currentServerTime - lastServerTime) / 1000;
      if (gapSeconds > 0 && gapSeconds <= 20) {
        this.lastHeartbeatTime.set(sessionId, currentServerTime);
      } else if (gapSeconds > 20) {
        this.lastHeartbeatTime.set(sessionId, currentServerTime);
      }
    } else if (!shouldCleanup && (event === 'play' || event === 'heartbeat')) {
      this.lastHeartbeatTime.set(sessionId, currentServerTime);
    }

    if (userAgent) agg.devices.add(userAgent.substring(0, 100));
  }

  async flushToDb() {
    if (this.aggregationMap.size === 0) return;

    const currentMap = new Map(this.aggregationMap);
    this.aggregationMap.clear();

    if (this.sessionViewCounted.size > 50000) {
      this.sessionViewCounted.clear();
      this.lastHeartbeatTime.clear();
    }

    try {
      await analyticsRepository.flushAnalytics(currentMap);
      console.log(`[AnalyticsWorker] Flushed ${currentMap.size} video(s) to DB`);
    } catch (e: any) {
      console.error('[AnalyticsWorker] Database flush failed:', e?.message, e?.stack);
    }
  }
}

export const analyticsWorkerService = new AnalyticsWorkerService();
