import { Worker } from 'bullmq';
import { db } from '../../db';
import { weeklyContent } from '../../db/schema';
import { getStoreProfile } from '../../db/queries';
import {
  generateInstagramPost,
  generateRedditPost,
  generateOutreachEmail,
  generateProductDescription,
  generatePinterestPin,
  generateBlogOutline,
} from '../../ai/content-generators';

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

const GENERATORS: Record<string, (userId: string, profile: any) => Promise<{ title: string; content: string }>> = {
  instagram: generateInstagramPost,
  reddit: generateRedditPost,
  email: generateOutreachEmail,
  product_description: generateProductDescription,
  pinterest: generatePinterestPin,
  blog: generateBlogOutline,
};

export const weeklyContentWorker = new Worker(
  'weekly-content',
  async (job) => {
    if (job.name === 'generate-weekly-content') {
      const { userId, contentType, weekStart } = job.data as {
        userId: string;
        contentType: string;
        weekStart: string;
      };

      const generator = GENERATORS[contentType];
      if (!generator) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      console.log(`[Weekly Content Worker] Generating ${contentType} for user ${userId}`);

      const storeProfile = await getStoreProfile(userId);
      const { title, content } = await generator(userId, storeProfile);

      // Save to weekly_content table
      await db.insert(weeklyContent).values({
        userId,
        weekStart,
        contentType,
        title,
        content,
        status: 'generated',
        generationJobId: job.id || null,
      });

      console.log(`[Weekly Content Worker] Successfully saved ${contentType} for user ${userId}`);
    }
  },
  {
    connection: connectionOptions,
  }
);
