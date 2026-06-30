import NextAuth, { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getUserByEmail, getUserById } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      subscriptionTier: string;
      onboardingCompleted: boolean;
      isEmailVerified: boolean;
      provider: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    subscriptionTier?: string;
    onboardingCompleted?: boolean;
  }
}

import { JWT } from 'next-auth/jwt';

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    subscriptionTier?: string;
    onboardingCompleted?: boolean;
    isEmailVerified?: boolean;
    provider?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email as string);
        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On first OAuth sign-in, ensure user exists in the custom users table
      if (user && account && account.provider !== 'credentials') {
        const existingUser = await getUserByEmail(user.email!);
        if (existingUser) {
          // Already registered via credentials with same email — link accounts
          token.sub = existingUser.id;
        } else {
          // New OAuth user — create a record in the custom users table
          const [newUser] = await db
            .insert(users)
            .values({
              email: user.email || '',
              name: user.name || null,
              avatarUrl: user.image || null,
              provider: account.provider,
              emailVerified: true,
              subscriptionTier: 'free',
              subscriptionStatus: 'inactive',
              onboardingCompleted: false,
              onboardingStep: 0,
            })
            .returning();
          token.sub = newUser.id;
        }
      } else if (user) {
        token.sub = user.id;
      }

      if (token.sub) {
        const dbUser = await getUserById(token.sub);
        if (dbUser) {
          token.userId = dbUser.id;
          token.subscriptionTier = dbUser.subscriptionTier ?? 'free';
          token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
          token.isEmailVerified = dbUser.emailVerified ?? false;
          token.provider = dbUser.provider ?? 'email';
        }

        // Update lastLoginAt and reset inactiveEmailStage only on fresh sign-in
        // (user object is present only during the initial sign-in JWT call, not on token refreshes)
        if (user) {
          db.update(users)
            .set({ lastLoginAt: new Date(), inactiveEmailStage: 0 })
            .where(eq(users.id, token.sub))
            .catch((e) => console.error('[Auth] lastLoginAt update failed:', e));
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId || token.sub) as string;
        session.user.subscriptionTier = (token.subscriptionTier || 'free') as string;
        session.user.onboardingCompleted = (token.onboardingCompleted || false) as boolean;
        session.user.isEmailVerified = (token.isEmailVerified ?? false) as boolean;
        session.user.provider = (token.provider || 'email') as string;
      }
      return session;
    },
  },
});
