import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

type Crumb = { href?: string; label: string };

type Props = {
  /** Crumbs shown left-to-right. Last item is the current page (no link). */
  items: Crumb[];
};

/**
 * Admin breadcrumb. Renders above the page `<h1>`. The first crumb should
 * point back to the parent listing (e.g. "Posts") so the user always has a
 * one-click escape from a detail/edit screen.
 */
export function AdminBreadcrumb({ items }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1 text-[12px] text-ink-48"
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
            {i === 0 && !isLast ? (
              <Icon name="settings" size={14} className="shrink-0 opacity-0" aria-hidden />
            ) : null}
            {i > 0 && (
              <span className="px-1 text-ink-48" aria-hidden="true">
                ›
              </span>
            )}
            {i === 0 && c.href && !isLast ? (
              <Link
                href={c.href}
                className="inline-flex items-center gap-1 rounded-8 px-2 py-1 text-primary hover:bg-canvas-parchment hover:underline"
              >
                <Icon name="settings" size={14} className="shrink-0 -rotate-180" />
                <span>Quay lại {c.label}</span>
              </Link>
            ) : c.href && !isLast ? (
              <Link href={c.href} className="text-primary hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-ink' : 'text-ink-80'}>{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
