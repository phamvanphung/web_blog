import type { ReactNode } from 'react';
import '@/styles/globals.css';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-bg text-fg font-ui">{children}</div>;
}
