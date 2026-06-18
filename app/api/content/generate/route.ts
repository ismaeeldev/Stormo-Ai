import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weeklyContent } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStoreProfile } from '@/lib/db/queries';
import {
  generateInstagramPost,
  generateRedditPost,
  generateOutreachEmail,
  generateProductDescription,
  generatePinterestPin,
  generateBlogOutline,
} from '@/lib/ai/content-generators';

const GENERATORS: Record<string, (userId: string, profile: any) => Promise<{ title: string; content: string }>> = {
  instagram: generateInstagramPost,
  reddit: generateRedditPost,
  email: generateOutreachEmail,
  product_description: generateProductDescription,
  pinterest: generatePinterestPin,
  blog: generateBlogOutline,
};

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { contentType, weekStart } = await request.json();

    if (!contentType || !weekStart) {
      return NextResponse.json({ error: 'Missing contentType or weekStart' }, { status: 400 });
    }

    const generator = GENERATORS[contentType];
    if (!generator) {
      return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
    }

    // Skip if already generated for this week
    const existing = await db
      .select({ id: weeklyContent.id })
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          eq(weeklyContent.contentType, contentType),
          eq(weeklyContent.weekStart, weekStart)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ skipped: true });
    }

    const storeProfile = await getStoreProfile(userId);
    const { title, content } = await generator(userId, storeProfile);

    const [saved] = await db
      .insert(weeklyContent)
      .values({
        userId,
        weekStart,
        contentType,
        title,
        content,
        status: 'generated',
      })
      .returning();

    return NextResponse.json({ success: true, item: saved });
  } catch (err: any) {
    console.error(`[Content Generate] Error:`, err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
