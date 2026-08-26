// app/(site)/not-found.tsx
// Custom 404 page for public site routes. Renders automatically when:
//   1. Any page in app/(site)/ throws `notFound()` (4 files:
//      [slug], blog/[slug], tag/[slug], chu-de/[slug]).
//   2. A URL doesn't match any page.tsx in app/(site)/.
//
// Reads the `site.notFoundPath` setting:
//   - If set: redirect to that path (307 internal / 308 external).
//   - If empty: render the brand fallback UI below (HTTP 404).
//
// Admin routes use Next.js's default 404 by design (decision 2 of spec).
// The site fallback is a brand-styled minimal page so visitors don't see
// Next.js's plain "404" text.
//
// Server component: needs getSetting() to read DB. `redirect()` throws
// NEXT_REDIRECT internally — the throw bubbles out of this component and
// Next.js handles the response.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { getSetting } from '@/modules/settings/server';

export default async function SiteNotFound() {
  const target = await getSetting('site.notFoundPath');
  if (target) {
    redirect(target);
  }
  return (
    <Container width="wide" className="py-section text-center">
      <h1 className="font-heading text-[44px] font-semibold tracking-[-0.015em] text-ink">
        404
      </h1>
      <p className="mt-3 text-[18px] leading-[1.45] text-ink-80">Không tìm thấy trang</p>
      <p className="mt-2 text-[15px] text-ink-48">
        Trang bạn tìm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-[15px] text-primary underline-offset-4 hover:underline"
      >
        ← Về trang chủ
      </Link>
    </Container>
  );
}
