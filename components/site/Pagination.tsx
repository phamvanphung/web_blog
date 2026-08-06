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
    <nav
      aria-label="Phân trang"
      className="mt-12 flex items-center justify-between text-[13px]"
    >
      {prev ? (
        <Link
          href={prev}
          className="rounded-pill bg-canvas-parchment px-4 py-2 text-ink hover:bg-chip"
        >
          ← Trang trước
        </Link>
      ) : (
        <span className="rounded-pill bg-canvas-parchment px-4 py-2 text-ink-48">
          ← Trang trước
        </span>
      )}
      <span className="text-ink-48">
        Trang {page} / {pageCount}
      </span>
      {next ? (
        <Link
          href={next}
          className="rounded-pill bg-canvas-parchment px-4 py-2 text-ink hover:bg-chip"
        >
          Trang sau →
        </Link>
      ) : (
        <span className="rounded-pill bg-canvas-parchment px-4 py-2 text-ink-48">
          Trang sau →
        </span>
      )}
    </nav>
  );
}
