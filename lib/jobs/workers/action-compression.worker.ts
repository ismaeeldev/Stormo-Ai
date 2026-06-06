import { Worker } from 'bullmq';
import { db } from '../../db';
import { actions, actionCompressedSummaries } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { getModel } from '../../ai/model';

// Extract hostname from REST URL for TCP/TLS connection
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

export const actionCompressionWorker = new Worker(
  'action-compression',
  async (job) => {
    if (job.name === 'compress-actions') {
      const { userId, batchStart, batchEnd } = job.data as {
        userId: string;
        batchStart: number;
        batchEnd: number;
      };

      // a. Fetch actions from batchStart to batchEnd (sorted by id or createdAt)
      const batchActions = await db
        .select()
        .from(actions)
        .where(eq(actions.userId, userId))
        .orderBy(asc(actions.createdAt))
        .offset(batchStart)
        .limit(batchEnd - batchStart + 1);

      const count = batchActions.length;
      if (count === 0) return;

      const actionsText = batchActions
        .map((a) => `- [${a.channel}] ${a.title}: ${a.description || ''}`)
        .join('\n');

      // b. Call getModel() from lib/ai/model.ts
      const model = getModel();

      // c. Prompt Claude
      const prompt = `Compress these ${count} marketing actions into a 80-100 token narrative summary. Focus on: channels used, outcomes signaled, patterns observed. Be specific, not generic. Actions:\n${actionsText}`;

      const response = await model.invoke(prompt);
      const summaryText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      // d. Save result to action_compressed_summaries table
      await db.insert(actionCompressedSummaries).values({
        userId,
        batchStart,
        batchEnd,
        summary: summaryText,
      });
    }
  },
  {
    connection: connectionOptions,
  }
);
