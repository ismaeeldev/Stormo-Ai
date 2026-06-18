import { NextResponse } from 'next/server';
import { auth } from '@/auth';

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weekStart = getMondayOfCurrentWeek();
    const contentTypes = ['instagram', 'reddit', 'email', 'product_description', 'pinterest', 'blog'];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fire-and-forget: each runs as an independent Vercel function invocation
    contentTypes.forEach((contentType) => {
      fetch(`${baseUrl}/api/content/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({ contentType, weekStart }),
      }).catch(() => {});
    });

    return NextResponse.json({
      success: true,
      message: `Triggered 6 content generation jobs for week starting ${weekStart}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
