import { db } from '../db';
import { weeklyContent } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getModel } from './model';

interface StoreProfile {
  storeUrl: string | null;
  storePlatform: string | null;
  productType: string | null;
  targetCustomer: string | null;
  priceRange: string | null;
  weeklyTimeAvailable: string | null;
  currentChallenges: string | null;
  storeAnalysis: string | null;
  nicheSummary: string | null;
}

async function getPastTitles(userId: string, contentType: string): Promise<string> {
  try {
    const records = await db
      .select({ title: weeklyContent.title })
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          eq(weeklyContent.contentType, contentType)
        )
      );
    return records.map((r) => r.title || '').filter(Boolean).join(', ');
  } catch (err) {
    console.error(`[Content Generator] Error fetching past titles:`, err);
    return '';
  }
}

async function generateContent(userId: string, contentType: string, storeProfile: StoreProfile | null, prompt: string) {
  const model = getModel();
  const pastTitles = await getPastTitles(userId, contentType);
  const currentDate = new Date().toISOString().split('T')[0];

  const fullPrompt = `${prompt}
  
  Context:
  - Current Date: ${currentDate}
  - Store URL: ${storeProfile?.storeUrl || 'N/A'}
  - Product Type: ${storeProfile?.productType || 'N/A'}
  - Target Customer: ${storeProfile?.targetCustomer || 'N/A'}
  - Price Range: ${storeProfile?.priceRange || 'N/A'}
  - Store Niche: ${storeProfile?.nicheSummary || 'N/A'}
  - Past generated content titles of this type (Do not repeat angles from previous weeks): ${pastTitles || 'None yet'}
  
  Output MUST be a JSON object with EXACTLY two keys:
  {
    "title": "A short, engaging title/headline for this piece of content",
    "content": "The actual post content/body (use markdown if appropriate)"
  }
  Output only the raw JSON. No conversational remarks or markdown code blocks.`;

  const response = await model.invoke(fullPrompt);
  const text = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);

  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const data = JSON.parse(cleanedText);
  
  return {
    title: data.title || `${contentType} post`,
    content: data.content || text,
  };
}

export async function generateInstagramPost(userId: string, storeProfile: StoreProfile | null) {
  const prompt = `Write a high-converting, engaging Instagram caption for this brand. Include a hook, descriptive body text, primary value proposition, relevant hashtags, and a clear call-to-action (CTA).`;
  return generateContent(userId, 'instagram', storeProfile, prompt);
}

export async function generateRedditPost(userId: string, storeProfile: StoreProfile | null) {
  const prompt = `Write a helpful, community-first Reddit post. It should not sound like a direct ad. Focus on sharing a story, founder journey, useful advice, or asking an engaging question related to the niche that fosters discussion.`;
  return generateContent(userId, 'reddit', storeProfile, prompt);
}

export async function generateOutreachEmail(userId: string, storeProfile: StoreProfile | null) {
  const prompt = `Write a cold outreach email template targeting potential partners, micro-influencers, or customers. Keep it brief, warm, highly personalized, value-focused, and conclude with a low-friction call-to-action.`;
  return generateContent(userId, 'email', storeProfile, prompt);
}

export async function generateProductDescription(userId: string, storeProfile: StoreProfile | null) {
  const prompt = `Write an engaging, SEO-optimized product description highlighting key features, emotional benefits, target buyer pain points, and a compelling call-to-purchase.`;
  return generateContent(userId, 'product_description', storeProfile, prompt);
}

export async function generatePinterestPin(userId: string, storeProfile: StoreProfile | null) {
  const prompt = `Create a Pinterest Pin description. Include a catchy, search-optimized headline, keyword-rich body description, and a call-to-action redirecting to the store.`;
  return generateContent(userId, 'pinterest', storeProfile, prompt);
}

export async function generateBlogOutline(userId: string, storeProfile: StoreProfile | null) {
  const prompt = `Create a detailed blog post outline. Include a suggested catchy title, target SEO keywords, a brief introduction paragraph hook, detailed H2 section breakdowns with bulleted subpoints, and a concluding call-to-action.`;
  return generateContent(userId, 'blog', storeProfile, prompt);
}
