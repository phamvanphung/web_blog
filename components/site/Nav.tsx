import Link from 'next/link';

const ITEMS = [
  { href: '/blog', label: 'Blog' },
  { href: '/chu-de', label: 'Chủ đề' },
  { href: '/dich-vu', label: 'Dịch vụ' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/lien-he', label: 'Liên hệ' }
];

export function Nav() {
  return (
    <nav aria-label="Chính" className="flex items-center gap-6 text-sm">
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className="hover:text-muted">
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
