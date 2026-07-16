import { BASE_URL } from '@/lib/env';

export async function GET() {
  const body = `User-agent: *
Disallow: /admin
Disallow: /g/
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
