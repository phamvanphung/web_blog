import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { SubNavFrosted } from '@/components/site/SubNavFrosted';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: '9ent — Blog công ty',
  description:
    'Show dự án, chia sẻ quá trình làm. Nơi khách hàng hiện hữu và tiềm năng thấy cách chúng tôi làm việc.'
});

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <SubNavFrosted />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
