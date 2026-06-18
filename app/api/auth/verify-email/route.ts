import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired verification link. Please request a new one.' }, { status: 400 });
    }

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, decoded.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
