// components/site/Header.tsx
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Logo } from './Logo';
import { Nav } from './Nav';
import { getMenuByLocation } from '@/modules/menus/server/public';

export async function Header() {
  const tree = await getMenuByLocation('primary').catch(() => []);
  const items = tree.map((n) => ({
    href: n.href,
    label: n.label,
    openInNew: n.openInNew
  }));
  return (
    <header className="border-b border-line">
      <Container className="flex items-center justify-between py-6">
        <Link href="/" aria-label="9ent — Trang chủ">
          <Logo />
        </Link>
        <Nav items={items} />
      </Container>
    </header>
  );
}
