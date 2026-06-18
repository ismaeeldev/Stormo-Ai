import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserByEmail } from '@/lib/db/queries';
import { sendVerificationEmail } from '@/lib/email/send-templates';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationLink = `${appUrl}/verify-email?token=${token}`;

    await sendVerificationEmail(email, verificationLink);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to resend email. Please try again.' }, { status: 500 });
  }
}
