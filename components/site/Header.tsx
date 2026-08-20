// components/site/Header.tsx
import { GlobalNav } from './GlobalNav';
import { Nav } from './Nav';
import { getMenuByLocation } from '@/modules/menus/server/public';

type Props = {
  siteName?: string;
};

export async function Header({ siteName }: Props = {}) {
  const tree = await getMenuByLocation('primary').catch(() => []);
  const items = tree.map((n) => ({
    href: n.href,
    label: n.label,
    openInNew: n.openInNew
  }));
  // Pass siteName through so GlobalNav can render the brand wordmark.
  if (items.length > 0) return <GlobalNav items={items} siteName={siteName} />;
  // Fallback: render Nav list inline at the same level GlobalNav would.
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur">
      <nav
        aria-label="Chính"
        className="mx-auto flex h-[68px] max-w-wide items-center justify-between gap-6 px-6"
      >
        <span className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
          {siteName ?? '9ent'}
        </span>
        <Nav items={[]} />
      </nav>
    </header>
  );
}
