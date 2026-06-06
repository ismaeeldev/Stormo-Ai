import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getStoreProfile } from '@/lib/db/queries';
import { getModel } from '@/lib/ai/model';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { eventName, eventDate } = await request.json();

    if (!eventName || !eventDate) {
      return NextResponse.json({ error: 'eventName and eventDate are required' }, { status: 400 });
    }

    const storeProfile = await getStoreProfile(userId);
    const productType = storeProfile?.productType || 'e-commerce products';
    const targetCustomer = storeProfile?.targetCustomer || 'our target audience';
    const nicheSummary = storeProfile?.nicheSummary || 'our niche';

    const prompt = `You are Stormo, an expert ecommerce marketing planner.
Design a highly tailored seasonal marketing campaign for an online store.

Store Profile:
- Product Type: ${productType}
- Target Customer: ${targetCustomer}
- Niche Summary: ${nicheSummary}

Target Event:
- Event Name: ${eventName}
- Event Date: ${eventDate}

Instructions:
1. Design a 3-day marketing campaign leading up to this event.
2. The campaign must include 3 highly actionable daily actions (Day 1, Day 2, Day 3) and 3 specific content ideas (social media, blog, or email drafts).
3. Always tailor suggestions specifically to the product type and target customer profile.

Respond ONLY with a JSON object. Do not include markdown blocks or extra comments. The JSON structure must match:
{
  "campaignName": "Catchy Campaign Name",
  "overview": "Brief 2-3 sentence overview of the campaign strategy",
  "suggestedActions": [
    "Action for Day 1 preceding the event",
    "Action for Day 2 preceding the event",
    "Action for Day 3 preceding the event"
  ],
  "contentIdeas": [
    "Content idea 1 description",
    "Content idea 2 description",
    "Content idea 3 description"
  ]
}`;

    const model = getModel();
    const response = await model.invoke(prompt);
    const text = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return NextResponse.json({
      eventName,
      eventDate,
      campaignName: data.campaignName || `${eventName} Sale`,
      overview: data.overview || 'Get ready for our seasonal event.',
      suggestedActions: data.suggestedActions || ['Setup outreach', 'Create content', 'Launch promotion'],
      contentIdeas: data.contentIdeas || ['Social post', 'Promo email', 'Special discount announcement'],
    });
  } catch (error: any) {
    console.error('[Generate Campaign Plan API] Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
