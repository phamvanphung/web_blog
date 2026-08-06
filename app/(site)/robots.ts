// app/(site)/robots.ts
import type { MetadataRoute } from 'next';

function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

export default function robots(): MetadataRoute.Robots {
  const APP_URL = appUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/preview']
      }
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL
  };
}
