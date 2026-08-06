import { Container } from '@/components/ui/Container';
import { Logo } from './Logo';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
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
  },
  {
    title: 'Kết nối',
    links: [
      { href: 'mailto:hello@9ent.vn', label: 'hello@9ent.vn' },
      { href: 'https://facebook.com', label: 'Facebook' },
      { href: 'https://youtube.com', label: 'YouTube' },
      { href: 'https://tiktok.com', label: 'TikTok' }
    ]
  }
];

/**
 * Parment bg, 4-col dense link list + legal row.
 * Asserted text per tests/e2e/home.spec.ts: must contain
 * the literal "Mọi quyền được bảo lưu".
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-canvas-parchment">
      <Container
        width="wide"
        className="grid grid-cols-2 gap-x-10 gap-y-10 py-section md:grid-cols-4"
      >
        <div className="col-span-2 md:col-span-1">
          <Logo tone="ink" />
          <p className="mt-4 max-w-[36ch] text-[13px] leading-snug text-ink-80">
            Show dự án, chia sẻ quá trình làm — nơi khách hàng hiện hữu và tiềm năng
            thấy cách chúng tôi làm việc.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="text-[13px]">
            <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">
              {col.title}
            </h3>
            <ul className="space-y-3 leading-snug text-ink-80">
              {col.links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <a
                    href={l.href}
                    className="hover:text-primary"
                    target={l.href.startsWith('http') ? '_blank' : undefined}
                    rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-hairline">
        <Container className="flex flex-wrap items-center justify-between gap-2 py-6 text-[12px] text-ink-48">
          <p>© {year} 9ent. Mọi quyền được bảo lưu.</p>
          <p>Built with care. No tracking cookies.</p>
        </Container>
      </div>
    </footer>
  );
}
