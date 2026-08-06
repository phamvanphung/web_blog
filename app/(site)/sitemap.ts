// app/(site)/sitemap.ts
import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const APP_URL = appUrl();
  const [posts, pages, categories] = await Promise.all([
    db.post
      .findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' }
      })
      .catch(() => [] as Array<{ slug: string; updatedAt: Date }>),
    db.page
      .findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true }
      })
      .catch(() => [] as Array<{ slug: string; updatedAt: Date }>),
    db.category
      .findMany({ select: { slug: true, updatedAt: true } })
      .catch(() => [] as Array<{ slug: string; updatedAt: Date }>)
  ]);

  const lastmod = (d: Date) => d.toISOString();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${APP_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/chu-de`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/tim-kiem`, lastModified: new Date(), changeFrequency: 'never', priority: 0.3 }
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p: { slug: string; updatedAt: Date }) => ({
    url: `${APP_URL}/blog/${p.slug}`,
    lastModified: lastmod(p.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8
  }));
  const pageEntries: MetadataRoute.Sitemap = pages.map((p: { slug: string; updatedAt: Date }) => ({
    url: `${APP_URL}/${p.slug}`,
    lastModified: lastmod(p.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.5
  }));
  const categoryEntries: MetadataRoute.Sitemap = categories.map((c: { slug: string; updatedAt: Date }) => ({
    url: `${APP_URL}/chu-de/${c.slug}`,
    lastModified: lastmod(c.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6
  }));

  return [...staticEntries, ...postEntries, ...pageEntries, ...categoryEntries];
}
