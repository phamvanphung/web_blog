import { Container } from '@/components/ui/Container';

export default function HomePage() {
  return (
    <Container width="prose" className="py-24">
      <p className="mb-4 text-sm uppercase tracking-widest text-muted">9ent.vn</p>
      <h1 className="mb-6 text-5xl leading-tight">Blog công ty 9ent</h1>
      <p className="mb-8 text-lg text-muted">
        Show dự án, chia sẻ quá trình làm — nơi khách hàng hiện hữu và tiềm năng thấy cách chúng tôi
        làm việc.
      </p>
      <p className="text-sm text-muted">
        Scaffolding P0 hoàn tất. Phase 1 (Auth) sẽ được thực thi tiếp theo.
      </p>
    </Container>
  );
}
