import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import PwaProvider from '@/components/pwa/PwaProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// ── PWA Viewport ─────────────────────────────────────────────────────────────
// viewport-fit=cover lets content extend behind the iOS notch / Dynamic Island.
// Use padding-top: env(safe-area-inset-top) on your header to stay below the notch.
export const viewport: Viewport = {
  themeColor: '#E8621A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,       // Allow pinch-to-zoom for accessibility
  viewportFit: 'cover',  // Required for iOS notch support
};

// ── App Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'Stormo.io — AI Marketing Manager',
    template: '%s | Stormo.io',
  },
  description:
    'Your AI marketing manager for ecommerce. One daily action. Weekly content written. Influencer outreach managed. Start for $9.',
  keywords: ['AI marketing', 'ecommerce marketing', 'store growth', 'marketing manager', 'Stormo'],
  authors: [{ name: 'Stormo.io' }],
  creator: 'Stormo.io',
  publisher: 'Stormo.io',

  // ── Web App Manifest ───────────────────────────────────────────────────────
  manifest: '/manifest.json',

  // ── iOS PWA meta tags ──────────────────────────────────────────────────────
  // These are required for iOS "Add to Home Screen" behaviour.
  appleWebApp: {
    capable: true,
    title: 'Stormo',
    statusBarStyle: 'black-translucent', // content extends behind status bar on iOS
    startupImage: [
      // ── iPhones (portrait) ────────────────────────────────────────────────
      // iPhone 17 Pro Max / 16 Pro Max — 1320×2868
      { url: '/splash/iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 17 Pro / 17 / 16 Pro — 1206×2622
      { url: '/splash/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait.png', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone Air — 1260×2736
      { url: '/splash/iPhone_Air_portrait.png', media: '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 16 Plus / 15 Pro Max / 15 Plus / 14 Pro Max — 1290×2796
      { url: '/splash/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 16 / 15 Pro / 15 / 14 Pro — 1179×2556
      { url: '/splash/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 14 Plus / 13 Pro Max / 12 Pro Max — 1284×2778
      { url: '/splash/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 17e / 16e / 14 / 13 / 12 — 1170×2532
      { url: '/splash/iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 13 mini / 12 mini / 11 Pro / XS / X — 1125×2436
      { url: '/splash/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 11 Pro Max / XS Max — 1242×2688
      { url: '/splash/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 11 / XR — 828×1792
      { url: '/splash/iPhone_11__iPhone_XR_portrait.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPhone 8 Plus / 7 Plus / 6s Plus — 1242×2208
      { url: '/splash/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 8 / 7 / 6s / 6 / SE 2nd — 750×1334
      { url: '/splash/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPhone SE 1st gen / iPod — 640×1136
      { url: '/splash/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // ── iPads (portrait) ──────────────────────────────────────────────────
      // iPad Pro M4 13" — 2064×2752
      { url: '/splash/13__iPad_Pro_M4_portrait.png', media: '(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Pro 12.9" — 2048×2732
      { url: '/splash/12.9__iPad_Pro_portrait.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Pro M4 11" — 1668×2420
      { url: '/splash/11__iPad_Pro_M4_portrait.png', media: '(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Pro 11" — 1668×2388
      { url: '/splash/11__iPad_Pro__10.5__iPad_Pro_portrait.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Air 10.9" — 1640×2360
      { url: '/splash/10.9__iPad_Air_portrait.png', media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Air 10.5" — 1668×2224
      { url: '/splash/10.5__iPad_Air_portrait.png', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad 10.2" — 1620×2160
      { url: '/splash/10.2__iPad_portrait.png', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Mini 8.3" — 1488×2266
      { url: '/splash/8.3__iPad_Mini_portrait.png', media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad 9.7" — 1536×2048
      { url: '/splash/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    ],
  },

  // ── Icons ──────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.png',                        type: 'image/png' },
      { url: '/icons/favicon.svg',                  type: 'image/svg+xml' },
      { url: '/icons/favicon-96x96.png',            type: 'image/png', sizes: '96x96' },
      { url: '/icons/web-app-manifest-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/web-app-manifest-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.png',
    // Apple touch icon — shown as home screen icon on iOS
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    siteName: 'Stormo.io',
    title: 'Stormo.io — AI Marketing Manager for Ecommerce',
    description:
      'One daily action. Content written. Customers growing. Start for $9.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Stormo.io' }],
  },

  // ── Twitter/X ──────────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Stormo.io — AI Marketing Manager',
    description: 'One daily action. Content written. Customers growing.',
    images: ['/og-image.png'],
  },

  // ── Robots ─────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          mobile-web-app-capable covers Android Chrome "Add to Home Screen".
          The apple-mobile-web-app-* equivalents are handled via metadata.appleWebApp above.
        */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Prevent phone number auto-detection on iOS (avoids broken links in content) */}
        <meta name="format-detection" content="telephone=no" />

        {/* Microsoft tile colour (Edge on Windows) */}
        <meta name="msapplication-TileColor" content="#E8621A" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
        </SessionProvider>
        {/* PWA: service worker registration + install prompt */}
        <PwaProvider />
      </body>
    </html>
  );
}
