// components/site/GlobalNav.tsx
import Image from 'next/image';
import Link from 'next/link';

type Item = { href: string; label: string; openInNew?: boolean };

type Props = {
  items: Item[];
  /** Brand wordmark text (default "9ent"). Read from `Setting.site.name`. */
  siteName?: string;
};

/**
 * Public site top nav — single row, horizontally centered within the page.
 *
 *   ┌─────────────────────────────────────────────────────────�
 *   │  [logo] 9ent                       BLOG  YOUTUBE  SHOP  │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Replaces the previous two-row band (52px black + 52px frosted).
 * Sticky so anchor links feel anchored.
 */
export function GlobalNav({ items, siteName }: Props) {
  const brand = (siteName ?? '9ent').trim() || '9ent';
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur">
      <nav
        aria-label="Chính"
        className="mx-auto flex h-[68px] max-w-wide items-center justify-between gap-6 px-6"
      >
        <Link
          href="/"
          aria-label={`${brand} — Trang chủ`}
          className="inline-flex items-center gap-3 rounded-8 outline-none transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-focus"
        >
          <Image
            src="/logo.svg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0"
            priority
          />
          <span className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
            {brand}
          </span>
        </Link>

        <ul className="flex items-center gap-7 text-[14px] text-ink-80">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                target={it.openInNew ? '_blank' : undefined}
                rel={it.openInNew ? 'noopener noreferrer' : undefined}
                className="rounded-8 px-2 py-1 transition-colors hover:text-primary"
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
