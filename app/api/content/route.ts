import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weeklyContent } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import { weeklyContentQueue } from '@/lib/jobs/queues';

// Initialize BullMQ workers in the background
import '@/lib/jobs/workers/weekly-content.worker';
import '@/lib/jobs/workers/action-compression.worker';

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const currentWeekStart = getMondayOfCurrentWeek();

    // Fetch this week's content
    let thisWeek = await db
      .select()
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          eq(weeklyContent.weekStart, currentWeekStart)
        )
      );

    let onboardingCompleted = false;
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length > 0) {
      onboardingCompleted = !!userResult[0].onboardingCompleted;
    }

    // If no content for the current week exists, check if onboarding is complete and trigger generation in background
    if (thisWeek.length === 0 && onboardingCompleted) {
      const contentTypes = ['instagram', 'reddit', 'email', 'product_description', 'pinterest', 'blog'];
      const jobPromises = contentTypes.map((contentType) =>
        weeklyContentQueue.add(
          'generate-weekly-content',
          {
            userId,
            contentType,
            weekStart: currentWeekStart,
          },
          {
            jobId: `wc:${userId}:${contentType}:${currentWeekStart}`,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 60000,
            },
          }
        )
      );
      await Promise.all(jobPromises);
      console.log(`[Content Get API] Auto-enqueued 6 content generation jobs for user ${userId} for week starting ${currentWeekStart}`);
    }

    // Fetch previous weeks' content
    const pastContent = await db
      .select()
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          ne(weeklyContent.weekStart, currentWeekStart)
        )
      );

    // Group past content by weekStart
    const pastGroupsMap: Record<string, typeof pastContent> = {};
    pastContent.forEach((item) => {
      const week = item.weekStart || 'Unknown';
      if (!pastGroupsMap[week]) {
        pastGroupsMap[week] = [];
      }
      pastGroupsMap[week].push(item);
    });

    const previousWeeks = Object.keys(pastGroupsMap)
      .sort((a, b) => b.localeCompare(a)) // Sort newest first
      .map((week) => ({
        weekStart: week,
        items: pastGroupsMap[week],
      }));

    return NextResponse.json({
      currentWeek: thisWeek,
      previousWeeks,
      onboardingCompleted,
    });
  } catch (err: any) {
    console.error('[Content Get API] Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
