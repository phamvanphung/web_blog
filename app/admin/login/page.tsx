import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  return (
    <Container width="narrow" className="py-24">
      <h1 className="mb-2 text-3xl">Đăng nhập</h1>
      <p className="mb-8 text-sm text-muted">Sẽ implement đầy đủ ở P1.</p>
      <form className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">Email</span>
          <input
            type="email"
            disabled
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Mật khẩu</span>
          <input
            type="password"
            disabled
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </label>
        <Button disabled>Đăng nhập (P1)</Button>
      </form>
    </Container>
  );
}
