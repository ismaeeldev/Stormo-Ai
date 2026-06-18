import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── PWA / Service Worker headers ───────────────────────────────────────────
  // sw.js must NEVER be browser-cached so updates reach users immediately.
  // Service-Worker-Allowed: / grants the SW control over the entire origin.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',         value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type',  value: 'application/manifest+json' },
        ],
      },
      {
        source: '/offline.html',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
