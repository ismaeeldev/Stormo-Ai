import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAskStormoChain } from '@/lib/ai/ask-stormo-chain';
import { saveAskStormoMessage, getAskStormoMessages } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { message } = (await request.json()) as { message: string };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // 1. Save user message to ask_stormo_messages table
    await saveAskStormoMessage(userId, 'user', message);

    // 2. Fetch last 20 messages from DB for context
    const dbMessages = await getAskStormoMessages(userId, 20);
    // getAskStormoMessages returns newest first. Reverse to chronological order:
    const sortedMessages = [...dbMessages].reverse();
    const messageHistory = sortedMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content || '',
    }));

    // Get the LangChain model and messages prompt
    const { model, messages } = await createAskStormoChain(userId, messageHistory);

    // Set up Server-Sent Events (SSE) streaming response
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await model.stream(messages);
          let fullResponseText = '';

          for await (const chunk of stream) {
            const token = typeof chunk.content === 'string'
              ? chunk.content
              : JSON.stringify(chunk.content);
              
            fullResponseText += token;
            
            if (token) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            }
          }

          // 3. After stream completes: save AI response to ask_stormo_messages table
          if (fullResponseText.trim()) {
            await saveAskStormoMessage(userId, 'assistant', fullResponseText);
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
    console.error('Ask Stormo message handler error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
