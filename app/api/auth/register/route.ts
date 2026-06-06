import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email/send-templates';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().optional(),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user into users table
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name: name || null,
        provider: 'email',
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
        onboardingCompleted: false,
        onboardingStep: 0,
      })
      .returning();

    // Send welcome and verification emails
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not configured');
      }

      // Generate verification token valid for 24h
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        jwtSecret,
        { expiresIn: '24h' }
      );

      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationLink = `${appUrl}/verify-email?token=${token}`;

      // Send welcome email
      await sendWelcomeEmail(email, name || 'Founder');

      // Send verification email
      await sendVerificationEmail(email, verificationLink);
    } catch (emailError) {
      // Log error but don't fail registration
      console.error('Failed to send verification/welcome emails:', emailError);
    }

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
