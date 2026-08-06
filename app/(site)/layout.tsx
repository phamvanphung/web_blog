import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { SubNavFrosted } from '@/components/site/SubNavFrosted';
import { buildMetadata } from '@/lib/seo';
import { getBrand } from '@/lib/brand';

// Async metadata — reads the same brand cache as the layout below.
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return buildMetadata({
    title: `${brand.siteName} — ${brand.tagline}`,
    description: brand.taglineLong,
    path: '/'
  });
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const brand = await getBrand();
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header siteName={brand.siteName} />
      <SubNavFrosted />
      <main className="flex-1">{children}</main>
      <Footer siteName={brand.siteName} tagline={brand.taglineLong} />
    </div>
  );
}
