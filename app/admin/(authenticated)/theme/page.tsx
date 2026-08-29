import { requireRole } from '@/lib/auth';
import { getTheme, DEFAULT_THEME_HEX } from '@/lib/theme';
import { THEME_KEYS, THEME_LABELS, type ThemeKey } from '@/modules/settings/types';
import { ThemeForm } from './ThemeForm';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

export const dynamic = 'force-dynamic';

export default async function ThemeAdminPage() {
  await requireRole('ADMIN');
  const theme = await getTheme();

  // Build initial values for the form. Each theme.* value falls back to the
  // tokens.css default if the DB row is missing (first deploy).
  const initial: Record<ThemeKey, string> = THEME_KEYS.reduce(
    (acc, key) => {
      acc[key] = theme[key] ?? DEFAULT_THEME_HEX[key];
      return acc;
    },
    {} as Record<ThemeKey, string>
  );

  return (
    <div className="space-y-8">
      <AdminBreadcrumb items={[{ href: '/admin', label: 'Admin' }, { label: 'Theme' }]} />

      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-d-sm font-semibold text-ink">Theme</h1>
          <p className="mt-1 text-[14px] text-ink-80">
            Cấu hình 8 màu chủ đạo áp dụng cho cả site và admin. Đổi xong bấm "Lưu theme" — site
            repaint ngay request kế tiếp (cache bị invalidate).
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-pill border border-hairline px-4 py-2 text-[13px] text-ink hover:bg-canvas-parchment"
        >
          Xem trên site ↗
        </a>
      </header>

      <ThemeForm initial={initial} />
    </div>
  );
}
