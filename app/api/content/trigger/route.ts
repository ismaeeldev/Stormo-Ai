import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { weeklyContentQueue } from '@/lib/jobs/queues';

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || session.user.id;

    const weekStart = getMondayOfCurrentWeek();
    const contentTypes = ['instagram', 'reddit', 'email', 'product_description', 'pinterest', 'blog'];

    const jobPromises = contentTypes.map((contentType) =>
      weeklyContentQueue.add(
        'generate-weekly-content',
        {
          userId,
          contentType,
          weekStart,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 min backoff
          },
        }
      )
    );

    await Promise.all(jobPromises);

    return NextResponse.json({
      success: true,
      message: `Enqueued 6 content generation jobs for user ${userId} for week starting ${weekStart}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
