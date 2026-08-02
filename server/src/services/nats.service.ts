import {
  connect,
  NatsConnection,
  JetStreamClient,
  AckPolicy,
} from "nats";
import { appConfig } from '../config';

class NatsService {
  private nc!: NatsConnection;
  private js!: JetStreamClient;

  async connect() {
    try {
      this.nc = await connect({
        servers: appConfig.natsUrl,
      });

      this.js = this.nc.jetstream();
      await this.setupStream();
      console.log('NATS Connected Successfully');
    } catch (error) {
      console.error('Failed to connect to NATS:', error);
    }
  }

  private async setupStream() {
    const jsm = await this.nc.jetstreamManager();

    const streamName = "videon_playback_events";

    try {
      await jsm.streams.info(streamName);
    } catch (error) {
      await jsm.streams.add({
        name: streamName,
        subjects: ["videon.analytics.playback.*"],
      });

      console.log(`Stream ${streamName} created`);
    }

    try {
      await jsm.consumers.info(
        streamName,
        "videon_analytics_worker",
      );
    } catch (error) {
      await jsm.consumers.add(streamName, {
        durable_name: "videon_analytics_worker",
        ack_policy: AckPolicy.Explicit,
      });

      console.log(
        "Durable pull consumer videon_analytics_worker created",
      );
    }
  }

  getJetStreamClient(): JetStreamClient {
    return this.js;
  }

  getNatsConnection(): NatsConnection {
    return this.nc;
  }

  async disconnect() {
    if (this.nc) {
      await this.nc.close();
    }
  }
}

export const natsService = new NatsService();
