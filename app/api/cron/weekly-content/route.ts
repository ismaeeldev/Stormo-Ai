import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weeklyContent, users } from '@/lib/db/schema';
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

export const maxDuration = 300;

const GENERATORS: Record<string, (userId: string, profile: any) => Promise<{ title: string; content: string }>> = {
  instagram: generateInstagramPost,
  reddit: generateRedditPost,
  email: generateOutreachEmail,
  product_description: generateProductDescription,
  pinterest: generatePinterestPin,
  blog: generateBlogOutline,
};

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
    const contentTypes = Object.keys(GENERATORS);
    let generated = 0;
    let skipped = 0;

    for (const user of activeUsers) {
      if (!user.onboardingCompleted) continue;
      const storeProfile = await getStoreProfile(user.id);

      for (const contentType of contentTypes) {
        // Skip if already exists
        const [existing] = await db
          .select({ id: weeklyContent.id })
          .from(weeklyContent)
          .where(
            and(
              eq(weeklyContent.userId, user.id),
              eq(weeklyContent.contentType, contentType),
              eq(weeklyContent.weekStart, weekStart)
            )
          )
          .limit(1);

        if (existing) { skipped++; continue; }

        try {
          const gen = GENERATORS[contentType];
          const { title, content } = await gen(user.id, storeProfile);
          await db.insert(weeklyContent).values({
            userId: user.id,
            weekStart,
            contentType,
            title,
            content,
            status: 'generated',
          });
          generated++;
        } catch (err) {
          console.error(`[Cron] Failed ${contentType} for user ${user.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generated} pieces, skipped ${skipped} for ${activeUsers.length} active users.`,
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
