import { Queue } from 'bullmq';
import { Redis } from '@upstash/redis';

// Initialize the Upstash Redis REST client for potential REST operations
export const upstashRedisRest = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Extract hostname from REST URL for TCP/TLS connection (BullMQ)
const redisHost = process.env.UPSTASH_REDIS_REST_URL
  ? process.env.UPSTASH_REDIS_REST_URL.replace(/^https?:\/\//, '')
  : 'localhost';

const connectionOptions = {
  host: redisHost,
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
  username: 'default',
  tls: {},
};

export const actionCompressionQueue = new Queue('action-compression', {
  connection: connectionOptions,
});

export const weeklyContentQueue = new Queue('weekly-content', {
  connection: connectionOptions,
});
