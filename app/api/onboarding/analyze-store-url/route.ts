import { NextResponse } from 'next/server';
import { load } from 'cheerio';
import { callClaudeJSON } from '@/lib/ai/claude';

// Haiku responds in 1-3s; fetch 5s; total well within Vercel Hobby's 10s cap.
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are analyzing a merchant's online store homepage to help build their marketing profile.

Extract the following information and return ONLY valid JSON matching this exact structure:
{
  "productCategories": ["string array of what they sell"],
  "positioning": "one of: luxury, boutique, mid-market, budget, mass-market",
  "priceTier": "one of: sub-$25, $25-75, $75-150, $150+",
  "storeStage": "one of: new and empty, early products, established catalog",
  "uniqueValueProps": ["string array: handmade, organic, vintage, sustainable, etc"],
  "targetAudienceSignals": {
    "ageRange": "estimated age range or null",
    "gender": "mostly female / mostly male / both / null",
    "lifestyle": "brief description or null"
  },
  "summary": "One sentence describing what this store sells and who it targets."
}

If you cannot determine a field from the homepage, use null. Do not guess beyond what is visible.
Return ONLY the JSON object. No explanation, no markdown.`;

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractText(html: string): string {
  const $ = load(html);

  // Remove noisy elements
  $('script, style, nav, footer, header, noscript, iframe, [aria-hidden="true"]').remove();

  // Collect meaningful text: headings, paragraphs, list items, product titles
  const parts: string[] = [];

  $('h1, h2, h3, h4, p, li, a, span, div').each((_, el) => {
    const text = $(el).clone().children().remove().end().text().trim();
    if (text.length > 5 && text.length < 300) {
      parts.push(text);
    }
  });

  // Deduplicate and join, capped at 3000 chars
  const unique = [...new Set(parts)];
  return unique.join(' ').slice(0, 3000);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = body as { url?: string };

    if (!url || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_URL', message: 'Please enter a valid store URL (e.g. https://mystore.com).' },
        { status: 400 }
      );
    }

    const normalizedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;

    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_URL', message: 'Please enter a valid store URL (e.g. https://mystore.com).' },
        { status: 400 }
      );
    }

    // Fetch homepage with 5-second timeout
    let html: string;
    try {
      const res = await fetch(normalizedUrl, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Stormo/1.0; +https://stormo.io)',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL_UNREACHABLE', message: 'The store URL could not be reached. Please check the URL and try again.' },
        { status: 200 } // 200 so frontend handles it as a known failure, not a crash
      );
    }

    // Extract readable text from HTML
    const pageText = extractText(html);

    if (!pageText.trim()) {
      return NextResponse.json(
        { success: false, error: 'URL_UNREACHABLE', message: 'The store URL could not be reached. Please check the URL and try again.' },
        { status: 200 }
      );
    }

    // Call Claude with 15-second timeout
    const userMessage = `Here is the homepage text content:\n<homepage>\n${pageText}\n</homepage>`;

    // Use Haiku for speed (1-3s) — analysis quality is sufficient for onboarding.
    const analysis = await Promise.race([
      callClaudeJSON(SYSTEM_PROMPT, userMessage, 'claude-haiku-4-5-20251001'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'URL_UNREACHABLE', message: 'Store analysis timed out. You can skip this step and continue.' },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('[analyze-store-url] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'URL_UNREACHABLE', message: 'Something went wrong. You can skip this step and continue.' },
      { status: 200 }
    );
  }
}
