import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAskStormoMessages } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const dbMessages = await getAskStormoMessages(userId, 50);
    const messages = [...dbMessages].reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Ask Stormo history handler error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
