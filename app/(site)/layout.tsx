import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: '9ent — Blog công ty',
  description:
    'Show dự án, chia sẻ quá trình làm. Nơi khách hàng hiện hữu và tiềm năng thấy cách 9ent làm việc.'
});

export default function SiteLayout({ children }: { children: ReactNode }) {
  // min-h-screen only — colors/fonts come from styles/globals.css (single source of truth).
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
