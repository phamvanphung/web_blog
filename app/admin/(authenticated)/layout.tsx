import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { requireAuth } from '@/lib/auth';

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
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/audit-log', label: 'Audit log' }
];

export default async function AuthedLayout({ children }: { children: ReactNode }) {
  // Guard: unauthenticated users get bounced to /admin/login.
  // Side effect: updates lastLoginAt? No — login flow does that explicitly.
  const user = await requireAuth();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-line bg-bg p-6 md:border-b-0 md:border-r">
        <h2 className="mb-1 text-lg font-semibold">9ent CMS</h2>
        <p className="mb-6 text-xs text-muted">
          {user.name} · {user.role.toLowerCase()}
          {' · '}
          <form action="/admin/logout" method="post" className="inline">
            <button type="submit" className="underline hover:no-underline">
              Logout
            </button>
          </form>
        </p>
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
