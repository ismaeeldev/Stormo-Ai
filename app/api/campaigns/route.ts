import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storeProfiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { actions } from '@/lib/db/schema';

function subtractDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const [profile] = await db
      .select()
      .from(storeProfiles)
      .where(eq(storeProfiles.userId, userId));

    return NextResponse.json({
      campaigns: profile?.campaigns || [],
      storeProfile: profile || null,
    });
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
    const campaign = await request.json();

    if (!campaign || !campaign.eventName) {
      return NextResponse.json({ error: 'Valid campaign object is required' }, { status: 400 });
    }

    // Fetch existing profile
    const [profile] = await db
      .select()
      .from(storeProfiles)
      .where(eq(storeProfiles.userId, userId));

    if (!profile) {
      return NextResponse.json({ error: 'Store profile not found. Complete onboarding first.' }, { status: 404 });
    }

    const existingCampaigns = Array.isArray(profile.campaigns)
      ? (profile.campaigns as any[])
      : [];

    const updatedCampaigns = [...existingCampaigns];
    const matchIndex = updatedCampaigns.findIndex(
      (c) => c.eventName === campaign.eventName && c.eventDate === campaign.eventDate
    );

    if (matchIndex >= 0) {
      updatedCampaigns[matchIndex] = campaign;
    } else {
      updatedCampaigns.push(campaign);
    }

    // Save campaign to store_profiles.campaigns JSON
    await db
      .update(storeProfiles)
      .set({
        campaigns: updatedCampaigns,
        updatedAt: new Date(),
      })
      .where(eq(storeProfiles.userId, userId));

    // Also insert the 3 suggestedActions into the actions table
    const suggestedActions = campaign.suggestedActions || [];
    const eventDate = campaign.eventDate;

    if (suggestedActions.length > 0 && eventDate) {
      // Clear existing scheduled actions for this campaign title to avoid duplicates
      for (let i = 0; i < suggestedActions.length; i++) {
        const actionTitle = `${campaign.campaignName} - Action ${i + 1}`;
        await db
          .delete(actions)
          .where(
            and(
              eq(actions.userId, userId),
              eq(actions.status, 'scheduled'),
              eq(actions.title, actionTitle)
            )
          );
      }

      // Insert the 3 actions scheduled for the 3 days leading up to the event date
      const insertPromises = suggestedActions.map((actionText: string, index: number) => {
        const daysToSubtract = 3 - index; // 3 days before, 2 days before, 1 day before
        const scheduledDate = subtractDays(eventDate, daysToSubtract);
        const actionTitle = `${campaign.campaignName} - Action ${index + 1}`;

        return db.insert(actions).values({
          userId,
          title: actionTitle,
          description: actionText,
          status: 'scheduled',
          scheduledFor: scheduledDate,
          channel: 'email',
          actionType: 'community',
        });
      });

      await Promise.all(insertPromises);
    }

    return NextResponse.json({ success: true, campaigns: updatedCampaigns });
  } catch (err: any) {
    console.error('[Campaigns POST API] Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
