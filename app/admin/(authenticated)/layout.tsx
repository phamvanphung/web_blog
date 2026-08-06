import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/site/Logo';
import { Icon, type IconName } from '@/components/ui/Icon';
import { requireAuth } from '@/lib/auth';
import { getBrand } from '@/lib/brand';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/posts', label: 'Bài viết', icon: 'post' },
  { href: '/admin/pages', label: 'Trang', icon: 'page' },
  { href: '/admin/categories', label: 'Danh mục', icon: 'category' },
  { href: '/admin/tags', label: 'Tag', icon: 'tag' },
  { href: '/admin/media', label: 'Media', icon: 'media' },
  { href: '/admin/menus', label: 'Menu', icon: 'menu' },
  { href: '/admin/contacts', label: 'Liên hệ', icon: 'contact' },
  { href: '/admin/users', label: 'Users', icon: 'user' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
  { href: '/admin/audit-log', label: 'Audit log', icon: 'audit' }
];

export default async function AuthedLayout({ children }: { children: ReactNode }) {
  // Guard: unauthenticated users get bounced to /admin/login.
  const user = await requireAuth();
  const brand = await getBrand();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[14rem_1fr]">
      <aside className="bg-tile-1 p-6 text-ink-ondark md:border-r md:border-tile-2">
        <Link
          href="/admin/dashboard"
          aria-label={`${brand.siteName} CMS`}
          className="mb-3 inline-block rounded-8 px-2 py-2 hover:bg-tile-2"
        >
          <Logo tone="ondark" text={brand.siteName} />
        </Link>
        <p className="mb-6 text-[12px] text-ink-dim">
          {user.name} · {user.role.toLowerCase()} ·{' '}
          <form action="/admin/logout" method="post" className="inline">
            <button
              type="submit"
              className="text-ink-dim underline hover:text-white hover:no-underline"
            >
              Logout
            </button>
          </form>
        </p>
        <nav aria-label="CMS" className="space-y-1 text-[14px]">
          {NAV.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex items-center gap-3 rounded-8 px-3 py-2 text-ink-dim transition-colors hover:bg-tile-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
            >
              <Icon name={it.icon} size={16} className="shrink-0" />
              <span>{it.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <Container width="wide" className="py-12">
        {children}
      </Container>
    </div>
  );
}
