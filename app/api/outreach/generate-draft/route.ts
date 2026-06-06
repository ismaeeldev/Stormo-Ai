import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { outreachContacts } from '@/lib/db/schema';
import { getStoreProfile } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { getModel } from '@/lib/ai/model';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { contactId } = await request.json();

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    // Fetch contact
    const [contact] = await db
      .select()
      .from(outreachContacts)
      .where(
        and(
          eq(outreachContacts.id, contactId),
          eq(outreachContacts.userId, userId)
        )
      );

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Fetch store profile
    const storeProfile = await getStoreProfile(userId);

    const storeDetails = storeProfile
      ? `Store URL: ${storeProfile.storeUrl || 'N/A'}, Product Type: ${storeProfile.productType || 'N/A'}, Target Customer: ${storeProfile.targetCustomer || 'N/A'}, Niche Summary: ${storeProfile.nicheSummary || 'N/A'}`
      : 'N/A';

    const prompt = `Write a personalized outreach cold message/email to ${contact.name || 'there'} on ${contact.platform || 'social media'}.
Store details: ${storeDetails}.
Niche match notes for this contact: ${contact.nicheMatch || 'N/A'}.

Instructions:
- Be genuine, highly personalized, brief, and specific.
- Avoid using standard generic templates.
- Write in a friendly but professional tone.
- Conclude with a simple, low-friction CTA (e.g. asking if they'd be open to checking out a free sample).
- Output ONLY the raw text message. Do not include subject lines, introduction titles, or formatting blocks unless part of the message body.`;

    const model = getModel();
    const response = await model.invoke(prompt);
    const draftText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Save to outreach_contacts table
    const [updatedContact] = await db
      .update(outreachContacts)
      .set({
        aiOutreachDraft: draftText,
      })
      .where(eq(outreachContacts.id, contactId))
      .returning();

    return NextResponse.json({
      draft: draftText,
      contact: updatedContact,
    });
  } catch (err: any) {
    console.error('[Generate Outreach Draft API] Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
