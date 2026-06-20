import { auth } from './auth';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const adminSecret = () => new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'change-me-in-prod');

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // ── Admin route protection (separate from user auth) ─────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.redirect(new URL('/admin/login', nextUrl));
    try {
      await jwtVerify(token, adminSecret());
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', nextUrl));
      res.cookies.delete('admin_token');
      return res;
    }
  }

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname === '/onboarding';
  // Webhook is Stripe-server-to-server — no session cookie, must not be gated
  const isStripeRoute = pathname.startsWith('/api/stripe/') && pathname !== '/api/stripe/webhook';

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
  matcher: ['/dashboard/:path*', '/onboarding', '/api/stripe/:path*', '/admin/:path*'],
};
