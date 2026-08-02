import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
};

export const appConfig = {
  environment: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '0.0.0.0',
  port: parsePort(process.env.PORT, 8000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  database_url: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  redisKeySecret: process.env.REDIS_KEY_SECRET ?? "",
  oneMinuteCloudApiKey: process.env.ONEMINUTECLOUD_API_KEY ?? "",
  oneMinuteCloudBucketId: process.env.ONEMINUTECLOUD_BUCKET_ID ?? "",
  oneMinuteCloudTranscodingBucketId: process.env.ONEMINUTECLOUD_TRANSCODING_BUCKET_ID ?? "",
  webhookUrl: process.env.WEBHOOK_URL ?? "",
  awsPublicAccessKey: process.env.AWS_PUBLIC_ACCESS_KEY ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "",
  awsS3BucketName: process.env.AWS_S3_BUCKET_NAME ?? "",
  analyticsJwtSecret: process.env.ANALYTICS_JWT_SECRET ?? "",
  natsUrl: process.env.NATS_URL ?? "nats://localhost:4223",
} as const;

