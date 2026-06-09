import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOnboardingChain } from '@/lib/ai/onboarding-chain';
import { getModel } from '@/lib/ai/model';
import { createStoreProfile, updateUserSubscription } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

import { analyzeStoreUrl } from '@/lib/ai/store-analyzer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { message, currentTopic, conversationHistory } = (await request.json()) as {
      message: string;
      currentTopic: number;
      conversationHistory: Message[];
    };

    if (!message || typeof currentTopic !== 'number') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Include the new user message in history for the chain
    const fullHistory: Message[] = [
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    // Get the onboarding chain config
    const { model, messages } = getOnboardingChain(currentTopic, fullHistory);

    // Call parallel data extraction (non-blocking, run in background)
    // This parses the user's message to extract variables for store_profiles
    (async () => {
      try {
        const extractionModel = getModel();
        const extractionPrompt = `You are a data extraction bot.
Analyze the user message and extract the following structured details based on Topic ${currentTopic}:
- Topic 1: Extract "storeUrl" (string) and "storePlatform" (string, e.g. Shopify, WooCommerce, Custom).
- Topic 2: Extract "productType" (string) and "priceRange" (string).
- Topic 3: Extract "targetCustomer" (string).
- Topic 4: Extract "weeklyTimeAvailable" (string).
- Topic 5: Extract "currentChallenges" (string).

User Message: "${message}"

Output ONLY a JSON block containing the fields extracted (e.g., {"storeUrl": "...", "storePlatform": "..."}). If a field is not mentioned, use null. Output no other words or formatting.`;

        const extractionResponse = await extractionModel.invoke(extractionPrompt);
        const text = typeof extractionResponse.content === 'string'
          ? extractionResponse.content
          : JSON.stringify(extractionResponse.content);
          
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedText);

        const cleanData: Record<string, any> = {};
        for (const key in data) {
          if (data[key] !== null) {
            cleanData[key] = data[key];
          }
        }

        if (Object.keys(cleanData).length > 0) {
          await createStoreProfile(userId, cleanData);
          console.log(`[Onboarding Extraction] Extracted and saved fields for user ${userId}:`, cleanData);
          
          if (cleanData.storeUrl) {
            // Trigger URL analysis in background (fire-and-forget)
            analyzeStoreUrl(cleanData.storeUrl, userId).catch((err) => {
              console.error('[Onboarding Extraction] Background store analysis failed:', err);
            });
          }
        }
      } catch (err) {
        console.error('[Onboarding Extraction] Error in parallel extraction:', err);
      }
    })();

    // Set up Server-Sent Events (SSE) streaming response
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await model.stream(messages);
          let fullResponseText = '';

          const completeRegex = /\{?\s*"?topicComplete"?\s*:\s*true\s*\}?/i;
          for await (const chunk of stream) {
            const token = typeof chunk.content === 'string'
              ? chunk.content
              : JSON.stringify(chunk.content);
              
            fullResponseText += token;
            
            // Strip the complete trigger if it starts appearing so user doesn't see raw JSON
            let cleanToken = token;
            if (completeRegex.test(fullResponseText)) {
              cleanToken = token.replace(completeRegex, '').replace(/\{?\s*"?topicComplete"?\s*:\s*$/, '');
            }

            if (cleanToken) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: cleanToken })}\n\n`));
            }
          }

          // Check if topic is completed using regex
          const isComplete = completeRegex.test(fullResponseText);
          console.log(`[Onboarding Debug] isComplete: ${isComplete}, fullResponseText ending with: "${fullResponseText.substring(Math.max(0, fullResponseText.length - 80))}"`);

          if (isComplete) {
            let nextStep = currentTopic;
            if (currentTopic < 5) {
              nextStep = currentTopic + 1;
              console.log(`[Onboarding Debug] Advancing database onboardingStep to ${nextStep} for user ${userId}`);
              await db
                .update(users)
                .set({ onboardingStep: nextStep, updatedAt: new Date() })
                .where(eq(users.id, userId));
            } else if (currentTopic === 5) {
              // Mark onboarding as completed
              console.log(`[Onboarding Debug] Onboarding complete. Marking onboardingCompleted = true for user ${userId}`);
              await db
                .update(users)
                .set({ onboardingCompleted: true, onboardingStep: 5, updatedAt: new Date() })
                .where(eq(users.id, userId));
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ topicComplete: true, nextTopic: nextStep })}\n\n`)
            );
          }

          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Onboarding message handler error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
