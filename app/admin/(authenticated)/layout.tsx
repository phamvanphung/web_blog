import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/site/Logo';
import { Button } from '@/components/ui/Button';
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
  const user = await requireAuth();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[14rem_1fr]">
      <aside className="bg-tile-1 p-6 text-ink-ondark md:border-r md:border-tile-2">
        <Link href="/admin/dashboard" aria-label="9ent CMS" className="mb-1 inline-block">
          <Logo tone="ondark" className="h-5 w-auto" />
        </Link>
        <p className="mb-6 text-[12px] text-ink-dim">
          {user.name} · {user.role.toLowerCase()} ·{' '}
          <form action="/admin/logout" method="post" className="inline">
            <button type="submit" className="text-ink-dim underline hover:text-white hover:no-underline">
              Logout
            </button>
          </form>
        </p>
        <nav className="space-y-1 text-[14px]">
          {NAV.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="block rounded-8 px-3 py-2 text-ink-dim transition-colors hover:bg-tile-2 hover:text-white"
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </aside>
      <Container width="wide" className="py-12">{children}</Container>
    </div>
  );
}
