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
 * Sticky black global nav (Apple pattern). 52px tall (h-subnav) + 1px hairline
 * so it reads as one confident band, not a cramped 44px bar.
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
        className="mx-auto flex h-subnav max-w-wide items-center justify-between gap-6 px-6"
      >
        <Link
          href="/"
          aria-label={`${brand} — Trang chủ`}
          className="inline-flex shrink-0 items-baseline rounded-8 px-2 py-2 outline-none hover:bg-tile-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
        >
          <Logo tone="ondark" text={brand} className="h-auto" />
        </Link>

        <ul className="flex items-center gap-7 text-[14px] text-ink-dim">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                target={it.openInNew ? '_blank' : undefined}
                rel={it.openInNew ? 'noopener noreferrer' : undefined}
                className="rounded-8 px-2 py-1 transition-colors hover:bg-tile-2 hover:text-white"
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-white/10">
        <p className="mx-auto flex h-[26px] max-w-wide items-center px-6 text-[11px] uppercase tracking-[0.08em] text-ink-dim">
          {strip}
        </p>
      </div>
    </header>
  );
}
