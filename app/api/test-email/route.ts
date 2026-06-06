import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send-templates';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'test@example.com';

    await sendWelcomeEmail(email, 'Test User');

    return NextResponse.json({ success: true, message: `Welcome email sent to ${email}` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error occurred' });
  }
}
