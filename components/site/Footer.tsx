import { Container } from '@/components/ui/Container';
import { Logo } from './Logo';
import { FooterColumns } from './FooterColumns';

type Props = {
  siteName?: string;
  tagline?: string;
  /** Contact email (from `contact.email` Setting). Renders in the "Kết nối" column. */
  email?: string;
};

const STATIC_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Blog',
    links: [
      { href: '/blog', label: 'Tất cả bài viết' },
      { href: '/chu-de', label: 'Chủ đề' },
      { href: '/tim-kiem', label: 'Tìm kiếm' }
    ]
  },
  {
    title: 'Công ty',
    links: [
      { href: '/gioi-thieu', label: 'Giới thiệu' },
      { href: '/dich-vu', label: 'Dịch vụ' },
      { href: '/lien-he', label: 'Liên hệ' }
    ]
  }
];

/**
 * Parment bg, 4-col dense link list + legal row.
 * Brand wordmark + tagline come from the `Setting` table (lib/brand.ts).
 * Asserted text per tests/e2e/home.spec.ts: footer must contain the
 * literal "Mọi quyền được bảo lưu".
 */
export function Footer({ siteName, tagline, email }: Props = {}) {
  const year = new Date().getFullYear();
  const brand = (siteName ?? '9ent').trim() || '9ent';
  const strip = (
    tagline?.trim() || 'Show dự án, chia sẻ quá trình làm.'
  ).trim();
  // Contact email rendered into the "Kết nối" column. Caller passes the
  // resolved value from getContactEmail(); fall back to the literal so the
  // component still works in isolation (e.g. tests / Storybook).
  const contactEmail = (email ?? 'hello@9ent.vn').trim() || 'hello@9ent.vn';
  const columns = [
    ...STATIC_COLUMNS,
    {
      title: 'Kết nối',
      links: [
        { href: `mailto:${contactEmail}`, label: contactEmail },
        { href: 'https://facebook.com', label: 'Facebook' },
        { href: 'https://youtube.com', label: 'YouTube' },
        { href: 'https://tiktok.com', label: 'TikTok' }
      ]
    }
  ];
  return (
    <footer className="bg-canvas-parchment">
      <Container
        width="wide"
        className="grid grid-cols-2 gap-x-10 gap-y-10 py-12 md:grid-cols-4 md:py-section"
      >
        <div className="col-span-2 md:col-span-1">
          <Logo tone="ink" text={brand} />
          <p className="mt-4 max-w-[36ch] text-[13px] leading-snug text-ink-80">
            {strip}
          </p>
        </div>
        {/* On mobile each column is a collapsible accordion (FooterColumns); */}
        {/* on md+ they render as static 3-col content matching the prior grid. */}
        <FooterColumns columns={columns} />
      </Container>
      <div className="border-t border-hairline">
        <Container className="flex flex-wrap items-center justify-between gap-2 py-6 text-[12px] text-ink-48">
          <p>© {year} {brand}. Mọi quyền được bảo lưu.</p>
          <p>Built with care. No tracking cookies.</p>
        </Container>
      </div>
    </footer>
  );
}
