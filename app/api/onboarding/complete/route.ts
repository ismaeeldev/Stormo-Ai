import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createStoreProfile } from '@/lib/db/queries';
import { generateDailyAction } from '@/lib/ai/action-generator';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const { answers } = body as { answers: Record<string, any> };

    if (!answers) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    // Extract basic fields for compatibility with existing DB columns
    const storeUrl = answers.storeUrl || null;
    const storePlatform = answers.storePlatform || null;
    const productType = answers.productType || null;
    const priceRange = answers.priceRange || null;
    const targetCustomer = answers.targetCustomer || null;
    const weeklyTimeAvailable = answers.weeklyTimeAvailable || null;
    const currentChallenges = answers.currentChallenges || null;

    // Save to store_profiles (insert or update via createStoreProfile)
    await createStoreProfile(userId, {
      storeUrl,
      storePlatform,
      productType,
      targetCustomer,
      priceRange,
      weeklyTimeAvailable,
      currentChallenges,
      onboardingAnswers: answers,
      updatedAt: new Date(),
    });

    // Mark onboardingCompleted = true in users table
    await db
      .update(users)
      .set({
        onboardingCompleted: true,
        onboardingStep: 5,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Generate the first daily action plan in background so it's ready when they land
    try {
      console.log(`[Onboarding Complete] Generating first daily action for user: ${userId}`);
      await generateDailyAction(userId);
    } catch (genErr) {
      console.error('[Onboarding Complete] Failed to generate initial daily action:', genErr);
      // Do not block the onboarding flow if action generation fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Onboarding Complete API] Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
