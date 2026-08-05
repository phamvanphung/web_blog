import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Logo } from './Logo';
import { Nav } from './Nav';

export function Header() {
  return (
    <header className="border-b border-line">
      <Container className="flex items-center justify-between py-6">
        <Link href="/" aria-label="9ent — Trang chủ">
          <Logo />
        </Link>
        <Nav />
      </Container>
    </header>
  );
}
