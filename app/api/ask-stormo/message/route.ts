import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAskStormoChain } from '@/lib/ai/ask-stormo-chain';
import { saveAskStormoMessage, getAskStormoMessages } from '@/lib/db/queries';

const MAX_MESSAGE_LENGTH = 2000;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { message } = body as { message?: unknown };

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds the ${MAX_MESSAGE_LENGTH}-character limit` },
        { status: 400 }
      );
    }

    // Save user message
    await saveAskStormoMessage(userId, 'user', trimmedMessage);

    // Fetch last 20 messages for context (newest-first → reverse to chronological)
    const dbMessages = await getAskStormoMessages(userId, 20);
    const messageHistory = [...dbMessages].reverse().map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content || '',
    }));

    const { model, messages } = await createAskStormoChain(userId, messageHistory);

    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        const send = (payload: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

        try {
          const aiStream = await model.stream(messages);
          let fullResponse = '';

          for await (const chunk of aiStream) {
            const token =
              typeof chunk.content === 'string'
                ? chunk.content
                : JSON.stringify(chunk.content);

            if (token) {
              fullResponse += token;
              send({ token });
            }
          }

          // Persist the complete AI response after streaming finishes
          if (fullResponse.trim()) {
            await saveAskStormoMessage(userId, 'assistant', fullResponse);
          }

          // Signal stream completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'AI stream error';
          send({ error: msg });
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Prevent proxy buffering for SSE
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'An error occurred';
    console.error('[ask-stormo] POST error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
