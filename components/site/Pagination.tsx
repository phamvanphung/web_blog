// components/site/Pagination.tsx
import Link from 'next/link';

type Props = {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
};

export function Pagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;
  const prev = page > 1 ? hrefFor(page - 1) : null;
  const next = page < pageCount ? hrefFor(page + 1) : null;
  return (
    <nav aria-label="Phân trang" className="mt-10 flex items-center justify-between text-sm">
      {prev ? (
        <Link href={prev} className="underline hover:no-underline">
          ← Trang trước
        </Link>
      ) : (
        <span className="text-muted">← Trang trước</span>
      )}
      <span className="text-muted">
        Trang {page} / {pageCount}
      </span>
      {next ? (
        <Link href={next} className="underline hover:no-underline">
          Trang sau →
        </Link>
      ) : (
        <span className="text-muted">Trang sau →</span>
      )}
    </nav>
  );
}
