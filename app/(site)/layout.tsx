import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { PopupLayer } from '@/components/site/PopupLayer';
import { ChatFloatingWidget } from '@/components/site/ChatFloatingWidget';
import { buildMetadata } from '@/lib/seo';
import { getBrand, getSiteName } from '@/lib/brand';
import { getContactChannels, getContactEmail } from '@/lib/contact';
import { getActivePopupsForPath } from '@/modules/popups/server/public';

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
  // Header uses the raw `site.name` so the logo wordmark renders blank when
  // unset — Footer / metadata keep the "9ent" default from `brand.siteName`.
  const headerSiteName = await getSiteName();
  const contactEmail = await getContactEmail();
  // Chat channels — read once per request alongside brand/contact. The
  // ChatFloatingWidget below is conditional on the admin toggle
  // (`chat.floatingEnabled`); the inline section in /lien-he always
  // renders, but ChatButtons inside it returns null when no IDs are set.
  const channels = await getContactChannels();

  // middleware stamps x-pathname on every non-static request. Fall back
  // to '/' so HOMEPAGE-trigger popups still match when the header is
  // missing (shouldn't happen behind our middleware).
  const h = await headers();
  const pathname = h.get('x-pathname') ?? '/';
  const popups = await getActivePopupsForPath(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header
        siteName={headerSiteName}
        homeHref={brand.homeHref}
        logoUrl={brand.logoUrl}
      />
      <main className="flex-1">{children}</main>
      <Footer siteName={brand.siteName} tagline={brand.taglineLong} email={contactEmail} />
      <PopupLayer popups={popups} />
      {channels.floatingEnabled && (
        <ChatFloatingWidget
          zaloPhone={channels.zaloPhone}
          messengerPageId={channels.messengerPageId}
        />
      )}
    </div>
  );
}
