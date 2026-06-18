import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname === '/onboarding';

  if (!isLoggedIn) {
    if (isDashboardRoute || isOnboardingRoute) {
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
    return NextResponse.next();
  }

  // User is logged in
  const subscriptionTier = req.auth?.user?.subscriptionTier;
  const onboardingCompleted = req.auth?.user?.onboardingCompleted;
  const hasActiveSubscription = subscriptionTier === 'starter' || subscriptionTier === 'growth';

  if (!hasActiveSubscription) {
    if (isDashboardRoute || isOnboardingRoute) {
      return NextResponse.redirect(new URL('/pricing', nextUrl));
    }
    return NextResponse.next();
  }

  // User is logged in and has active subscription
  if (isDashboardRoute && !onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', nextUrl));
  }

  if (isOnboardingRoute && onboardingCompleted) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Match both dashboard routes and onboarding route to perform session redirections
  matcher: ['/dashboard/:path*', '/onboarding'],
};
