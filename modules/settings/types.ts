// modules/settings/types.ts
// String-literal union of every key in the Setting table. Adding a new key
// here is what the type system uses to gate downstream reads/writes — there
// is no runtime schema to update because the table is a free-form key/value
// store (`Setting.key String @id`, `Setting.value String`).

export type SettingKey =
  | 'site.name'
  | 'site.tagline'
  | 'site.logo'
  | 'site.favicon'
  | 'site.homeHref'
  | 'site.notFoundPath'
  | 'contact.email'
  | 'social.facebook'
  | 'social.youtube'
  | 'social.tiktok'
  | 'analytics.ga4'
  | 'analytics.fbPixel'
  | 'newsletter.substackUrl'
  | 'seo.defaultTitle'
  | 'seo.defaultDescription'
  | 'seo.ogImage'
  | 'content.postsPerPage'
  | 'content.timezone'
  | 'theme.primary'
  | 'theme.secondary'
  | 'theme.surface.canvas'
  | 'theme.surface.warm'
  | 'theme.surface.dark'
  | 'theme.ink.heading'
  | 'theme.hairline'
  | 'theme.badge';

export type SettingsMap = Partial<Record<SettingKey, string>>;

/**
 * Subset of `SettingKey` consumed by the Theme Management feature. Listed
 * here (not derived from `SettingKey`) so the order is stable for the admin
 * UI form rendering — alphabetical `SettingKey` would scramble the visual
 * hierarchy (primary → secondary → surfaces → ink → hairline → badge).
 */
export type ThemeKey =
  | 'theme.primary'
  | 'theme.secondary'
  | 'theme.surface.canvas'
  | 'theme.surface.warm'
  | 'theme.surface.dark'
  | 'theme.ink.heading'
  | 'theme.hairline'
  | 'theme.badge';

/** Display order matches the admin form: brand → surfaces → ink → borders → accents. */
export const THEME_KEYS: readonly ThemeKey[] = [
  'theme.primary',
  'theme.secondary',
  'theme.surface.canvas',
  'theme.surface.warm',
  'theme.surface.dark',
  'theme.ink.heading',
  'theme.hairline',
  'theme.badge'
] as const;

/** Human-readable labels for each theme key (Vietnamese, matches admin UI). */
export const THEME_LABELS: Record<ThemeKey, { label: string; description: string }> = {
  'theme.primary': {
    label: 'Màu chính (Primary)',
    description: 'CTA chính — nút "Đăng ký", "Mua ngay", link hover.'
  },
  'theme.secondary': {
    label: 'Màu phụ (Secondary)',
    description: 'CTA phụ — nút ghost, badge nhấn nhẹ.'
  },
  'theme.surface.canvas': {
    label: 'Nền chính (Canvas)',
    description: 'Background trang — thường là trắng hoặc tone rất nhạt.'
  },
  'theme.surface.warm': {
    label: 'Nền phụ (Warm)',
    description: 'Background phụ cho section xen kẽ — parchment/pearl.'
  },
  'theme.surface.dark': {
    label: 'Nền tối (Dark tile)',
    description: 'Khối heading lớn, footer, CTA section — tone đậm nhất.'
  },
  'theme.ink.heading': {
    label: 'Chữ heading (Ink)',
    description: 'Màu chữ tiêu đề + body. Body muted tự derive.'
  },
  'theme.hairline': {
    label: 'Đường viền (Hairline)',
    description: 'Border, divider giữa các khối.'
  },
  'theme.badge': {
    label: 'Điểm nhấn (Badge)',
    description: 'Highlight, badge nhãn — tone nhẹ nổi bật.'
  }
};
