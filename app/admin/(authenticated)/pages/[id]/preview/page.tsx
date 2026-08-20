import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { BlockRenderer } from '@/components/site/BlockRenderer';
import { JsonLd } from '@/components/site/JsonLd';
import { webPageJsonLd } from '@/modules/seo/lib/jsonld';
import { requireRole } from '@/lib/auth';
import { getPage } from '@/modules/pages/server';
import type { Section } from '@/modules/pages/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PagePreviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('ADMIN');
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  const sections = (page.sections ?? []) as Section[];
  const isFullLanding = sections.length === 1 && sections[0]?.kind === 'rawhtml';

  return (
    <>
      {/* JSON-LD mirrors the public catch-all so preview SEO matches what
          search engines actually see. */}
      <JsonLd data={webPageJsonLd({ title: page.title, description: page.seoDescription, slug: page.slug })} />

      {/* Preview banner — fixed overlay at top so the rendered page chrome
          below is identical to the public catch-all (no extra banner
          pushing content down, no different parent container that would
          affect RawHtmlBlock's iframe height measurement). */}
      <div className="fixed top-0 left-0 right-0 z-[100] border-b border-hairline bg-canvas-parchment shadow-sm">
        <Container width="prose" className="py-3">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-ink-80">
              <strong className="text-ink">Preview</strong> · Đây là phiên bản đã lưu gần nhất
              (status hiện tại: <strong>{page.status}</strong>). Lưu thay đổi trước khi xem.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/pages/${page.id}/edit`}
                className="rounded-8 border border-hairline bg-canvas px-3 py-1 text-[12px] text-ink hover:bg-canvas-parchment"
              >
                ← Quay lại sửa
              </Link>
              <Link
                href={`/${page.slug}`}
                target="_blank"
                className="rounded-8 bg-primary px-3 py-1 text-[12px] font-medium text-white"
              >
                Mở trang thật ↗
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Body — exactly the same wrapper structure as app/(site)/[slug]/page.tsx
          so what the admin sees matches what visitors see. */}
      {isFullLanding ? (
        <BlockRenderer sections={sections} />
      ) : (
        <Tile tone="light">
          <Container width="prose" className="py-section">
            <h1 className="text-d-md">{page.title}</h1>
            <div className="mt-md">
              <BlockRenderer sections={sections} />
            </div>
          </Container>
        </Tile>
      )}
    </>
  );
}