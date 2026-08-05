import type { ReactNode } from 'react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import '@/styles/globals.css';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg font-ui">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
