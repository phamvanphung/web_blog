'use client';

import { usePathname } from 'next/navigation';
import { ButtonLink } from '@/components/ui/ButtonLink';

type Section = {
  match: (pathname: string) => boolean;
  label: string;
  cta?: { href: string; label: string };
};

/** Static section map — pure presentation, no DB fetch. */
const SECTIONS: Section[] = [
  { match: (p) => p === '/' || p === '', label: 'Trang chủ' },
  { match: (p) => p.startsWith('/blog'), label: 'Blog', cta: { href: '/blog', label: 'Tất cả bài' } },
  {
    match: (p) => p.startsWith('/chu-de') || p.startsWith('/tag'),
    label: 'Chủ đề'
  },
  {
    match: (p) => p.startsWith('/lien-he') || p.startsWith('/gioi-thieu'),
    label: 'Liên hệ',
    cta: { href: '/lien-he', label: 'Gửi yêu cầu' }
  },
  {
    match: (p) => p.startsWith('/tim-kiem'),
    label: 'Tìm kiếm'
  }
];

/**
 * Sticky frosted-glass sub-nav (52px). Sits below GlobalNav.
 * Returns null on routes that don't map to a public surface.
 */
export function SubNavFrosted() {
  const pathname = usePathname() ?? '';
  const section = SECTIONS.find((s) => s.match(pathname));
  if (!section) return null;

  return (
    <div className="frosted sticky top-[68px] z-40 border-b border-hairline">
      <div className="mx-auto flex h-subnav max-w-wide items-center justify-between px-6">
        <span className="text-[21px] font-semibold tracking-tight text-ink">
          {section.label}
        </span>
        {section.cta && (
          <ButtonLink href={section.cta.href} variant="primary-pill" size="sm">
            {section.cta.label}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
