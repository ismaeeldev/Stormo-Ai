import fetch from 'node-fetch';
import { getModel } from './model';
import { createStoreProfile } from '../db/queries';

/**
 * Strips HTML tags, script, and style blocks to get meaningful text.
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes URL formats to ensure they have the protocol.
 */
function normalizeUrl(url: string): string {
  let clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  return clean;
}

/**
 * Analyzes an e-commerce store URL by fetching its home page text
 * and running Claude analysis to extract details.
 *
 * @param url - The store URL to analyze.
 * @param userId - The user ID associated with the store.
 */
export async function analyzeStoreUrl(url: string, userId: string): Promise<void> {
  const normalized = normalizeUrl(url);
  console.log(`[Store Analyzer] Starting analysis for user ${userId} on URL: ${normalized}`);

  let htmlContent = '';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(normalized, {
      signal: controller.signal as any,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    htmlContent = await response.text();
  } catch (error: any) {
    console.warn(`[Store Analyzer] Failed to fetch URL ${normalized} for user ${userId}: ${error.message}`);
    // Return gracefully, do not fail onboarding
    return;
  }

  const cleanedText = cleanHtml(htmlContent).slice(0, 3000);
  if (!cleanedText) {
    console.warn(`[Store Analyzer] Cleaned text is empty for URL ${normalized}`);
    return;
  }

  try {
    const model = getModel();
    const prompt = `Analyze this ecommerce store page content. Extract:
(1) primary product category,
(2) target customer profile,
(3) price positioning (budget, mid, or premium),
(4) unique selling proposition,
(5) niche summary in exactly 2 sentences.

Output your analysis in a structured narrative format. At the very end of your response, output a JSON block matching this format:
{"nicheSummary": "[niche summary here]"}

Store Page Content:
${cleanedText}`;

    const response = await model.invoke(prompt);
    const analysisText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Extract nicheSummary JSON from the response text
    let nicheSummary = 'E-commerce Store Profile';
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*?"nicheSummary"[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.nicheSummary) {
          nicheSummary = parsed.nicheSummary;
        }
      }
    } catch (e) {
      console.warn('[Store Analyzer] Failed to parse nicheSummary JSON from response, using default fallback', e);
    }

    // Save to database
    await createStoreProfile(userId, {
      storeAnalysis: analysisText,
      nicheSummary: nicheSummary,
    });

    console.log(`[Store Analyzer] Analysis completed and saved for user ${userId}`);
  } catch (error: any) {
    console.error(`[Store Analyzer] Error during Claude analysis for user ${userId}:`, error.message);
  }
}
