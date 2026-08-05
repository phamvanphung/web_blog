import { Container } from '@/components/ui/Container';
import { Logo } from './Logo';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted">Show dự án, chia sẻ quá trình làm.</p>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-ui text-sm font-semibold uppercase tracking-wider text-muted">
            Liên hệ
          </h4>
          <a href="mailto:hello@9ent.vn">hello@9ent.vn</a>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-ui text-sm font-semibold uppercase tracking-wider text-muted">
            Mạng xã hội
          </h4>
          <ul className="space-y-1">
            <li>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
            <li>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            </li>
            <li>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="py-6 text-xs text-muted">
          © {year} 9ent. Mọi quyền được bảo lưu.
        </Container>
      </div>
    </footer>
  );
}
