import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { BlockRenderer } from '@/components/site/BlockRenderer';
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

  return (
    <>
      {/* Preview banner — visible only in admin preview, not on the public site. */}
      <div className="bg-canvas-parchment border-b border-hairline">
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

      {/* Mirror the public catch-all chrome exactly. */}
      <Tile tone="light">
        <Container width="prose" className="py-section">
          <h1 className="text-d-md">{page.title}</h1>
          <div className="mt-md">
            <BlockRenderer sections={(page.sections ?? []) as Section[]} />
          </div>
        </Container>
      </Tile>
    </>
  );
}
