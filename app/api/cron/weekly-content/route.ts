import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { weeklyContentQueue } from '@/lib/jobs/queues';

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

async function handleWeeklyCron(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeUsers = await db
      .select()
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'));

    const weekStart = getMondayOfCurrentWeek();
    const contentTypes = ['instagram', 'reddit', 'email', 'product_description', 'pinterest', 'blog'];
    let jobsAdded = 0;

    for (let i = 0; i < activeUsers.length; i++) {
      const user = activeUsers[i];
      const staggerDelay = i * 1000; // 1-second stagger between users

      for (const contentType of contentTypes) {
        await weeklyContentQueue.add(
          'generate-weekly-content',
          {
            userId: user.id,
            contentType,
            weekStart,
          },
          {
            delay: staggerDelay,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 60000,
            },
          }
        );
        jobsAdded++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enqueued ${jobsAdded} jobs for ${activeUsers.length} active users.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleWeeklyCron(request);
}

export async function POST(request: Request) {
  return handleWeeklyCron(request);
}
