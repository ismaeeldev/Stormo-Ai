export function GET() {
  const robots = `User-agent: *
Allow: /

Sitemap: https://stormo.io/sitemap.xml`.trim();

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
