// app/(site)/chu-de/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { buildMetadata } from '@/lib/seo';
import { listCategoriesWithCounts } from '@/modules/categories/server/public';

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: 'Chủ đề — 9ent',
  description: 'Tất cả chủ đề trên blog 9ent.',
  path: '/chu-de'
});

export default async function CategoriesIndex() {
  const cats = await listCategoriesWithCounts().catch(() => []);
  return (
    <>
      <Tile tone="parchment">
        <Container width="wide" className="py-20 text-center">
          <p className="mb-3 text-[13px] uppercase tracking-[0.08em] text-ink-48">
            Kho tàng
          </p>
          <h1 className="text-d-md">Chủ đề</h1>
        </Container>
      </Tile>
      <Tile tone="light">
        <Container width="wide" className="py-section">
          {cats.length === 0 ? (
            <p className="text-ink-48">Chưa có chủ đề.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cats.map((c) => (
                <li
                  key={c.id}
                  className="rounded-18 bg-canvas-parchment p-6 transition-colors hover:bg-chip"
                >
                  <Link href={`/chu-de/${c.slug}`} className="block">
                    <span className="block text-[21px] font-semibold tracking-tight text-ink hover:text-primary">
                      {c.name}
                    </span>
                    <span className="mt-1 block text-[12px] uppercase tracking-[0.08em] text-ink-48">
                      {c.count} bài
                    </span>
                    {c.description && (
                      <p className="mt-3 text-[15px] leading-snug text-ink-80">
                        {c.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Tile>
    </>
  );
}
