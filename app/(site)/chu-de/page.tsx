// app/(site)/chu-de/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
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
    <Container width="prose" className="py-16">
      <h1 className="mb-8 text-4xl">Chủ đề</h1>
      {cats.length === 0 ? (
        <p className="text-muted">Chưa có chủ đề.</p>
      ) : (
        <ul className="space-y-3">
          {cats.map((c) => (
            <li key={c.id} className="border-b border-line py-3">
              <Link href={`/chu-de/${c.slug}`} className="hover:text-accent">
                {c.name} <span className="text-muted">({c.count})</span>
              </Link>
              {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
