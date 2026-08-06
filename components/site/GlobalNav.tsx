import Link from 'next/link';
import { Logo } from './Logo';

type Item = { href: string; label: string; openInNew?: boolean };

type Props = {
  items: Item[];
  /** Brand wordmark text (default "9ent"). Read from `Setting.site.name`. */
  siteName?: string;
  /** Site tagline shown in the thin tag-strip (default "Blog công ty"). */
  tagline?: string;
};

/**
 * Sticky black global nav (Apple pattern). 44px tall, edge-to-edge.
 *
 * E2E invariant (tests/e2e/public-search.spec.ts): exactly ONE
 * `input[name="q"]` and ONE `button[type="submit"]` on `/tim-kiem`.
 * Consequence: this component renders NEITHER. No `<form>`, no
 * `<button type="submit">`, no `<h1>` either (public-blog.spec
 * requires the first h1 to live in page content, not chrome).
 */
export function GlobalNav({ items, siteName, tagline }: Props) {
  const brand = (siteName ?? '9ent').trim() || '9ent';
  const strip = (tagline ?? 'Blog công ty').trim() || 'Blog công ty';

  return (
    <header className="sticky top-0 z-50 bg-tile-black">
      <nav
        aria-label="Chính"
        className="mx-auto flex h-nav max-w-wide items-center gap-7 px-6"
      >
        <Link href="/" aria-label={brand} className="shrink-0">
          <Logo tone="ondark" text={brand} className="h-4 w-auto" />
        </Link>
        <ul className="flex items-center gap-6 text-[12px] text-ink-dim">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                target={it.openInNew ? '_blank' : undefined}
                rel={it.openInNew ? 'noopener noreferrer' : undefined}
                className="transition-colors hover:text-white"
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-wide items-center justify-between px-6 py-fine text-[11px] uppercase tracking-[0.08em] text-ink-dim">
          <span>{strip}</span>
          <span>{brand.toLowerCase()}.vn</span>
        </div>
      </div>
    </header>
  );
}
