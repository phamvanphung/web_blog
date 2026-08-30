import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { getTheme } from '@/lib/theme';
import { applyThemeOverrides } from '@/lib/color';
import { getBrand } from '@/lib/brand';

// Loaded at build time and exposed as --font-inter. Combined with system SF Pro
// in tokens.css → --font-sans.
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-inter',
  display: 'swap'
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Resolve theme colors + favicon from the Setting table (cached). The
  // inline <style> emitted here runs BEFORE first paint so there's no flash
  // of default theme. `<html suppressHydrationWarning>` already in place
  // (below) tolerates the server-emitted <style> not matching any client-side
  // render path.
  const [theme, brand] = await Promise.all([getTheme(), getBrand()]);
  const themeCss = applyThemeOverrides(theme);

  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Explicit <link rel="icon"> — overrides the Next.js file-convention
            favicon so admin can change it via Setting.site.favicon. Falls
            back to /favicon.ico when unset. Same BRAND_TAG cache as the
            public-site layout, so admin updates invalidate both. */}
        <link rel="icon" href={brand.faviconUrl} />
        {themeCss && (
          <style
            data-theme-inline="server"
            dangerouslySetInnerHTML={{ __html: themeCss }}
          />
        )}
      </head>
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
