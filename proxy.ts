import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname === '/onboarding';
  const isStripeRoute = pathname.startsWith('/api/stripe/');

  if (!isLoggedIn) {
    if (isDashboardRoute || isOnboardingRoute || isStripeRoute) {
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
    return NextResponse.next();
  }

  // ── Email verification gate ───────────────────────────────────────────────
  // Only applies to email/password users — Google OAuth is already verified
  const emailVerified = req.auth?.user?.isEmailVerified ?? false;
  const provider = req.auth?.user?.provider ?? 'email';
  const needsVerification = !emailVerified && provider === 'email';

  if (needsVerification) {
    if (isDashboardRoute || isOnboardingRoute || isStripeRoute) {
      return NextResponse.redirect(new URL('/verify-email-required', nextUrl));
    }
    return NextResponse.next();
  }

  // ── Subscription gate ─────────────────────────────────────────────────────
  const subscriptionTier = req.auth?.user?.subscriptionTier;
  const onboardingCompleted = req.auth?.user?.onboardingCompleted;
  const hasActiveSubscription = subscriptionTier === 'starter' || subscriptionTier === 'growth';

  if (!hasActiveSubscription) {
    if (isDashboardRoute || isOnboardingRoute) {
      return NextResponse.redirect(new URL('/pricing', nextUrl));
    }
    return NextResponse.next();
  }

  // User is logged in, verified, and has active subscription
  if (isDashboardRoute && !onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', nextUrl));
  }

  if (isOnboardingRoute && onboardingCompleted) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding', '/api/stripe/:path*'],
};
