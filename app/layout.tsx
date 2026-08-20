import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

// Loaded at build time and exposed as --font-inter. Combined with system SF Pro
// in tokens.css → --font-sans.
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-inter',
  display: 'swap'
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
