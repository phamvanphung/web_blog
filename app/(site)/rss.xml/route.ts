// app/(site)/rss.xml/route.ts
import { db } from '@/lib/db';

export const revalidate = 600;

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = await db.post
    .findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        author: { select: { name: true } }
      }
    })
    .catch(() => [] as Array<{
      title: string;
      slug: string;
      excerpt: string | null;
      publishedAt: Date | null;
      author: { name: string };
    }>);

  const items = posts
    .map((p) => {
      const url = `${APP_URL}/blog/${p.slug}`;
      const pub = (p.publishedAt ?? new Date()).toUTCString();
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pub}</pubDate>
      <description>${escapeXml(p.excerpt ?? '')}</description>
      <dc:creator>${escapeXml(p.author.name)}</dc:creator>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>9ent — Blog công ty</title>
    <link>${APP_URL}</link>
    <description>Show dự án, chia sẻ quá trình làm.</description>
    <language>vi</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' }
  });
}
