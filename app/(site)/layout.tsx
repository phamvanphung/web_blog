import type { ReactNode } from 'react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import '@/styles/globals.css';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    // min-h-screen only — colors/fonts come from styles/globals.css (single source of truth).
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
