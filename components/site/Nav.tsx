// components/site/Nav.tsx
import Link from 'next/link';

type Item = { href: string; label: string; openInNew?: boolean };

const FALLBACK: Item[] = [
  { href: '/blog', label: 'Blog' },
  { href: '/chu-de', label: 'Chủ đề' },
  { href: '/dich-vu', label: 'Dịch vụ' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/lien-he', label: 'Liên hệ' }
];

export function Nav({ items }: { items?: Item[] } = {}) {
  const list = items && items.length > 0 ? items : FALLBACK;
  return (
    <nav aria-label="Chính" className="flex items-center gap-7 text-[12px] text-ink-dim">
      {list.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          target={it.openInNew ? '_blank' : undefined}
          rel={it.openInNew ? 'noopener noreferrer' : undefined}
          className="transition-colors hover:text-white"
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
