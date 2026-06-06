import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/queries';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '@/lib/email/send-templates';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    // If email exists, generate reset token and send email
    if (user) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET environment variable is not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      // Generate token valid for 1 hour
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      // Call real email sending utility
      await sendPasswordResetEmail(user.email, resetLink);
    }

    // Always return 200/success to avoid user enumeration vulnerability
    return NextResponse.json({ message: 'If this email exists, a reset link was sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
