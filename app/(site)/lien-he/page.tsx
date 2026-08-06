// app/(site)/lien-he/page.tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { ContactForm } from '@/components/site/ContactForm';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Liên hệ — 9ent',
  description: 'Gửi yêu cầu cho 9ent. Chúng tôi phản hồi trong 24 giờ làm việc.',
  path: '/lien-he'
});

export default function ContactPage() {
  return (
    <Tile tone="parchment">
      <Container width="narrow" className="py-section">
        <p className="mb-3 text-[13px] uppercase tracking-[0.08em] text-ink-48">
          Liên hệ
        </p>
        <h1 className="text-d-md">Liên hệ</h1>
        <p className="mt-4 max-w-[44ch] text-[17px] text-ink-80">
          Gửi yêu cầu cho chúng tôi. Email{' '}
          <a href="mailto:hello@9ent.vn" className="text-primary hover:underline">
            hello@9ent.vn
          </a>{' '}
          hoặc điền form bên dưới — chúng tôi phản hồi trong 24 giờ làm việc.
        </p>
        <div className="mt-10">
          <ContactForm />
        </div>
      </Container>
    </Tile>
  );
}
