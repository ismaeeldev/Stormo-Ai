import { NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/ai/claude';

// Haiku responds in 1-3s — well within Vercel Hobby's 10s cap.
export const maxDuration = 25;

// Maps each topic to the fields Claude should try to extract,
// and which question IDs can be skipped if those fields are found.
const TOPIC_FIELDS: Record<string, { fields: string[]; skipIfExtracted: string[] }> = {
  topic1: {
    fields: ['productCategory', 'foundingStory', 'geographicReach', 'fulfillmentModel'],
    skipIfExtracted: ['t1_q3_desc'],
  },
  topic2: {
    fields: ['gender', 'ageRange', 'incomeLevel', 'interests', 'location', 'purchaseMotivation'],
    skipIfExtracted: ['t2_q2_age', 't2_q3_gender'],
  },
  topic3: {
    fields: ['storeAge', 'salesCount', 'marketingAttempted', 'resultsOfAttempts'],
    skipIfExtracted: ['t3_q1_sales', 't3_q2_ads'],
  },
  topic4: {
    fields: ['weeklyHours', 'onCamera', 'socialMediaComfort', 'contentFormats'],
    skipIfExtracted: ['t4_q1_time', 't4_q5_on_camera'],
  },
  topic5: {
    fields: ['nineDayTarget', 'sideProjectOrMainIncome', 'successDefinition'],
    skipIfExtracted: ['t5_q2_goal_type'],
  },
};

// Maps each skippable question ID to the extracted field it depends on.
// If that field is present in the Claude extraction, the question can be skipped.
const QUESTION_TO_FIELD: Record<string, string> = {
  't1_q3_desc':        'productCategory',
  't2_q2_age':         'ageRange',
  't2_q3_gender':      'gender',
  't3_q1_sales':       'salesCount',
  't3_q2_ads':         'marketingAttempted',
  't4_q1_time':        'weeklyHours',
  't4_q5_on_camera':   'onCamera',
  't5_q2_goal_type':   'sideProjectOrMainIncome',
};

const CONFIDENCE_THRESHOLD = 0.70;

function buildSystemPrompt(topicId: string, fields: string[]): string {
  return `You are extracting structured data from a merchant's onboarding answer.

Topic: ${topicId}
Fields to extract: ${fields.join(', ')}

Return ONLY valid JSON in this exact structure:
{
  "confidence": 0.0,
  "extracted": {
    ${fields.map(f => `"${f}": null`).join(',\n    ')}
  },
  "missingFields": []
}

Rules:
- "confidence" measures how clearly and accurately the answer states the values you extracted.
  1.0 = the answer explicitly and unambiguously states these values.
  0.5 = the values are implied or partially stated.
  0.0 = the text is too vague to extract anything reliable.
  Do NOT measure how many fields are covered — measure how clear the text is for what it DOES say.
- For each field: set the value if clearly stated or strongly implied in the answer. Set null if not mentioned.
- "missingFields" lists every field name whose value is null.
- Only extract what is clearly stated or strongly implied. Do not invent values.
- If the answer is pure nonsense or contains no useful information at all, set confidence to 0.0 and all fields to null.
- Return ONLY the JSON object. No explanation, no markdown, no code fences.`;
}

function buildAllMissingResponse(fields: string[]) {
  return {
    success: true,
    confidence: 0,
    extracted: {},
    missingFields: fields,
    skipFollowUps: [],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { answer, topicId, existingAnswers } = body as {
      answer?: string;
      topicId?: string;
      existingAnswers?: Record<string, any>;
    };

    // Validate required fields
    if (!answer || !answer.trim()) {
      return NextResponse.json(buildAllMissingResponse([]), { status: 200 });
    }

    if (!topicId || !TOPIC_FIELDS[topicId]) {
      return NextResponse.json(buildAllMissingResponse([]), { status: 200 });
    }

    const { fields, skipIfExtracted } = TOPIC_FIELDS[topicId];

    // Call Claude with a 12-second race timeout
    const systemPrompt = buildSystemPrompt(topicId, fields);
    const userMessage = `The merchant answered: "${answer.trim()}"`;

    let claudeResult: {
      confidence: number;
      extracted: Record<string, any>;
      missingFields: string[];
    } | null = null;

    try {
      claudeResult = await Promise.race([
        callClaudeJSON(systemPrompt, userMessage, 'claude-haiku-4-5-20251001'),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
    } catch {
      // Claude threw — treat as graceful degradation
    }

    // Graceful degradation: Claude failed, timed out, or returned unparseable JSON
    if (!claudeResult) {
      return NextResponse.json(buildAllMissingResponse(fields), { status: 200 });
    }

    const confidence = typeof claudeResult.confidence === 'number' ? claudeResult.confidence : 0;

    // Below confidence threshold — show all follow-up questions
    if (confidence < CONFIDENCE_THRESHOLD) {
      return NextResponse.json(buildAllMissingResponse(fields), { status: 200 });
    }

    // Determine extracted fields: any field with a non-null value
    const extracted = claudeResult.extracted ?? {};
    const extractedFieldNames = Object.entries(extracted)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k]) => k);

    const missingFields = claudeResult.missingFields ?? fields.filter(f => !extractedFieldNames.includes(f));

    // Determine which question IDs can be skipped:
    // A question can be skipped only if its corresponding field was extracted
    const skipFollowUps = skipIfExtracted.filter(questionId => {
      const requiredField = QUESTION_TO_FIELD[questionId];
      return requiredField && extractedFieldNames.includes(requiredField);
    });

    return NextResponse.json({
      success: true,
      confidence,
      extracted,
      missingFields,
      skipFollowUps,
    });
  } catch (error) {
    console.error('[parse-answer] Unexpected error:', error);
    // Always return a valid response — never crash onboarding
    return NextResponse.json(buildAllMissingResponse([]), { status: 200 });
  }
}
