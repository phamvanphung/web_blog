import { Logo } from '@/components/site/Logo';

export default function HomePage() {
  return (
    <main className="container-prose py-24">
      <Logo className="mb-12" />
      <h1 className="text-5xl mb-6">Blog công ty 9ent</h1>
      <p className="text-muted text-lg leading-relaxed">
        Show dự án, chia sẻ quá trình làm. Scaffolding P0 hoàn tất.
      </p>
      <hr className="my-12 border-line" />
      <p className="text-sm text-muted">
        Tokens: <code>bg</code> warm off-white, <code>fg</code> charcoal,
        <code>accent</code> placeholder — sẽ override bằng brand thật.
      </p>
    </main>
  );
}
