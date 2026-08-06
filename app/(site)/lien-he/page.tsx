// app/(site)/lien-he/page.tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { ContactForm } from '@/components/site/ContactForm';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Liên hệ — 9ent',
  description: 'Gửi yêu cầu cho 9ent. Chúng tôi phản hồi trong 24 giờ làm việc.',
  path: '/lien-he'
});

export default function ContactPage() {
  return (
    <Container width="narrow" className="py-16">
      <h1 className="mb-4 text-4xl">Liên hệ</h1>
      <p className="mb-8 text-muted">
        Gửi yêu cầu cho chúng tôi. Email{' '}
        <a href="mailto:hello@9ent.vn">hello@9ent.vn</a> hoặc điền form:
      </p>
      <ContactForm />
    </Container>
  );
}
