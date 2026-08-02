import { Redis } from 'ioredis';
import { appConfig } from '../config';

export const redisClient = new Redis(appConfig.redisUrl, {
  family: 4,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

redisClient.on('connect', () => console.log('Redis Connected'));
redisClient.on('error', (err) => console.error('Redis error', err.message));
