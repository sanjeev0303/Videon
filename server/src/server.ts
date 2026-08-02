import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import http from 'node:http';
import { appConfig } from './config';
import { createExpressApp } from './express-app';
import { prisma } from './utils/prisma';
import { redisClient } from './utils/redis';
import { startApiKeyUsageCron } from './schedulers';
import { natsService } from './services';
import { analyticsWorkerService } from './consumer';

const app = createExpressApp();
const server = http.createServer(app);

const shutdown = async (signal: string): Promise<void> => {
  await analyticsWorkerService.stop();
  await natsService.disconnect();
  server.close(() => {
    process.exit(0);
  });

  console.log(`Received ${signal}. Shutting down gracefully.`);
};

async function bootstrap() {
  try {
    // Check Database Connection
    await prisma.$connect();
    console.log('Database Connected Successfully');

    // Check Redis Connection
    await redisClient.ping();
    console.log('Redis Connected Successfully');

    // Start background jobs
    startApiKeyUsageCron();
    console.log('Background Jobs Started Successfully');

    // Connect to NATS
    await natsService.connect();
    
    // Start analytics worker
    await analyticsWorkerService.start();

    server.listen(appConfig.port, appConfig.host, () => {
      console.log(`Server running at http://${appConfig.host}:${appConfig.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
