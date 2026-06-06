import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getModel } from '@/lib/ai/model';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if the user has an active subscription
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!dbUser || dbUser.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'An active subscription is required to use this feature' },
        { status: 403 }
      );
    }

    const { handles, platform } = (await request.json()) as { handles: string[]; platform: string };

    if (!handles || !Array.isArray(handles) || !platform) {
      return NextResponse.json({ error: 'Handles array and Platform are required' }, { status: 400 });
    }

    const model = getModel();

    // Query in parallel
    const analysisPromises = handles.map(async (handle) => {
      try {
        const prompt = `For the ${platform} account handle '${handle}', make educated guesses about:
1. Likely real name or account name (just the handle cleaned up if unsure)
2. Estimated niche (2-3 words, e.g. 'eco skincare creator')
3. Estimated follower range (micro: 1k-10k / mid: 10k-100k / macro: 100k+)
You are helping an ecommerce store owner identify potential influencer partners.
Respond ONLY in JSON: { "name": "...", "nicheMatch": "...", "followerEstimate": "..." }`;

        const response = await model.invoke(prompt);
        const text = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedText);

        return {
          handle,
          name: data.name || handle,
          nicheMatch: data.nicheMatch || 'Unknown',
          followerEstimate: data.followerEstimate || 'Unknown',
        };
      } catch (err) {
        console.error(`[Bulk Import Handle ${handle}] Failed:`, err);
        return {
          handle,
          name: handle,
          nicheMatch: 'Unknown',
          followerEstimate: 'Unknown',
        };
      }
    });

    const enrichedContacts = await Promise.all(analysisPromises);

    return NextResponse.json({ contacts: enrichedContacts });
  } catch (error: any) {
    console.error('[Bulk Import API] Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
