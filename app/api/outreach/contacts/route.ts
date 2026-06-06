import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { outreachContacts } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { checkAndAwardMilestones } from '@/lib/milestones/check-milestones';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const contacts = await db
      .select()
      .from(outreachContacts)
      .where(eq(outreachContacts.userId, userId))
      .orderBy(desc(outreachContacts.createdAt));

    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { name, platform, profileUrl, followerCount, nicheMatch } = body;

    if (!name || !platform) {
      return NextResponse.json({ error: 'Name and Platform are required' }, { status: 400 });
    }

    // Duplicate check: skip silently if contact with same platform + profileUrl exists
    if (profileUrl) {
      const [existingContact] = await db
        .select()
        .from(outreachContacts)
        .where(
          and(
            eq(outreachContacts.userId, userId),
            eq(outreachContacts.platform, platform),
            eq(outreachContacts.profileUrl, profileUrl)
          )
        );

      if (existingContact) {
        return NextResponse.json(existingContact, { status: 200 });
      }
    }

    // Insert new contact
    const [newContact] = await db
      .insert(outreachContacts)
      .values({
        userId,
        name,
        platform,
        profileUrl: profileUrl || null,
        followerCount: followerCount ? parseInt(followerCount, 10) : null,
        nicheMatch: nicheMatch || null,
        status: 'identified',
        followUpDue: new Date().toISOString().split('T')[0], // Default follow-up to today
      })
      .returning();

    // After save: run checkAndAwardMilestones
    await checkAndAwardMilestones(userId, 'outreach_added');

    return NextResponse.json(newContact, { status: 201 });
  } catch (err: any) {
    console.error('[Outreach POST API] Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
