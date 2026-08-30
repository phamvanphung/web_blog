// components/site/GlobalNav.tsx
import Image from 'next/image';
import Link from 'next/link';
import { MobileNav } from './MobileNav';

type Item = { href: string; label: string; openInNew?: boolean };

type Props = {
  items: Item[];
  /** Brand wordmark text (default "9ent"). Read from `Setting.site.name`. */
  siteName?: string;
  /** Logo / wordmark link target. Falls back to `/` when unset. */
  homeHref?: string;
  /** Logo image URL. Falls back to `/logo.svg` when unset. */
  logoUrl?: string;
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
export function GlobalNav({ items, siteName, homeHref, logoUrl }: Props) {
  // No default fallback for siteName — site.name may legitimately be unset,
  // in which case the wordmark area renders blank (per design intent). The
  // image logo still renders so the home link stays discoverable.
  const brand = (siteName ?? '').trim();
  const home = (homeHref ?? '/').trim() || '/';
  // logoUrl falls back to `/logo.svg` so existing setups without a configured
  // logo keep working out of the box. Read from `Setting.site.logo`.
  const logo = (logoUrl ?? '/logo.svg').trim() || '/logo.svg';
  // Absolute URLs open in a new tab so the in-site nav stack doesn't get
  // ripped out from under the visitor when they click the logo.
  const externalHome = /^https?:\/\//i.test(home);
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur">
      <nav
        aria-label="Chính"
        className="mx-auto flex h-[68px] max-w-wide items-center justify-between gap-6 px-6"
      >
        <Link
          href={home}
          target={externalHome ? '_blank' : undefined}
          rel={externalHome ? 'noopener noreferrer' : undefined}
          aria-label={brand ? `${brand} — Trang chủ` : 'Trang chủ'}
          className="inline-flex items-center gap-3 rounded-8 outline-none transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-focus"
        >
          <Image
            src={logo}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0"
            priority
          />
          {brand && (
            <>
              {/* Mobile: compact wordmark so the brand stays
                  discoverable on small screens. Whole word on one line,
                  truncated if too long for the 68px header minus logo
                  and the trailing hamburger button. */}
              <span className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ink md:hidden">
                {brand}
              </span>
              {/* PC: full-size wordmark, inline with the desktop nav. */}
              <span className="hidden text-[20px] font-semibold tracking-[-0.01em] text-ink md:inline">
                {brand}
              </span>
            </>
          )}
        </Link>

        <ul className="hidden items-center gap-7 text-[14px] text-ink-80 md:flex">
          {items.map((it, i) => (
            <li key={`${i}-${it.href}`}>
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

        {/* Hamburger + right-side drawer for mobile only (md:hidden inside). */}
        <MobileNav items={items} />
      </nav>
    </header>
  );
}
