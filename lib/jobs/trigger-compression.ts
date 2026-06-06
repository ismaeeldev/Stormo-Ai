import { db } from '../db';
import { actions } from '../db/schema';
import { eq, count } from 'drizzle-orm';
import { actionCompressionQueue } from './queues';

/**
 * Checks the total number of actions for a user.
 * If the total count is divisible by 30 (and > 0), triggers the compression background job.
 * 
 * @param userId - The ID of the user whose actions to count and compress.
 */
export async function triggerCompressionIfNeeded(userId: string): Promise<void> {
  const [result] = await db
    .select({ value: count() })
    .from(actions)
    .where(eq(actions.userId, userId));

  const totalActions = result?.value || 0;

  // If count is divisible by 30 (and > 0): add job to actionCompressionQueue
  if (totalActions > 0 && totalActions % 30 === 0) {
    const batchStart = totalActions - 30;
    const batchEnd = totalActions - 1;

    await actionCompressionQueue.add('compress-actions', {
      userId,
      batchStart,
      batchEnd,
    });
  }
}
