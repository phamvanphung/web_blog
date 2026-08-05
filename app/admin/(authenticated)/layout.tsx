import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/posts', label: 'Bài viết' },
  { href: '/admin/pages', label: 'Trang' },
  { href: '/admin/categories', label: 'Danh mục' },
  { href: '/admin/tags', label: 'Tag' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/menus', label: 'Menu' },
  { href: '/admin/contacts', label: 'Liên hệ' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-line bg-bg p-6 md:border-b-0 md:border-r">
        <h2 className="mb-6 text-lg font-semibold">9ent CMS</h2>
        <nav className="space-y-2 text-sm">
          {NAV.map((it) => (
            <Link key={it.href} href={it.href} className="block hover:underline">
              {it.label}
            </Link>
          ))}
        </nav>
      </aside>
      <Container className="py-10">{children}</Container>
    </div>
  );
}
