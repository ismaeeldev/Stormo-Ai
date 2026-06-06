import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTodaysAction } from '@/lib/db/queries';
import { generateDailyAction } from '@/lib/ai/action-generator';

export async function POST(request: Request) {
  try {
    // 1. Require auth session
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const subscriptionTier = session.user.subscriptionTier;

    // 2. Require active subscription (starter or growth)
    if (subscriptionTier !== 'starter' && subscriptionTier !== 'growth') {
      return NextResponse.json(
        { error: 'An active subscription plan is required to access daily actions.' },
        { status: 403 }
      );
    }

    // 3. Check if action already exists for today
    const existingAction = await getTodaysAction(userId);
    if (existingAction) {
      return NextResponse.json(existingAction);
    }

    // 4. Generate daily action if none exists
    const newAction = await generateDailyAction(userId);
    return NextResponse.json(newAction);
  } catch (error: any) {
    console.error('[Generate Action Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate daily action plan' },
      { status: 500 }
    );
  }
}
