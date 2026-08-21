// app/admin/(authenticated)/settings/SettingMeta.ts
// Human-readable label + description for every known SettingKey.
// Used by the settings admin page so a missing row in the DB still
// renders an editable input — the action `upsert`s on first save.

import type { SettingKey } from '@/modules/settings/types';

export type SettingMeta = {
  label: string;
  description: string;
  group: 'site' | 'contact' | 'social' | 'analytics' | 'newsletter' | 'seo' | 'content';
};

export const SETTING_META: Record<SettingKey, SettingMeta> = {
  'site.name': {
    label: 'Tên site',
    description: 'Hiển thị trên header, footer, tiêu đề trang.',
    group: 'site'
  },
  'site.tagline': {
    label: 'Khẩu hiệu',
    description: 'Một dòng ngắn mô tả site, dùng cho hero + meta description.',
    group: 'site'
  },
  'site.logo': {
    label: 'Logo URL',
    description: 'Đường dẫn /logo.svg hoặc URL ảnh đầy đủ.',
    group: 'site'
  },
  'site.favicon': {
    label: 'Favicon URL',
    description: 'Ảnh nhỏ 16×16 hoặc 32×32 cho tab trình duyệt.',
    group: 'site'
  },
  'site.homeHref': {
    label: 'Đường dẫn Trang chủ',
    description:
      'Nơi logo / wordmark điều hướng đến. Để trống để dùng `/` (homepage mặc định). Có thể là đường dẫn tương đối (`/landing`) hoặc URL tuyệt đối (`https://...`).',
    group: 'site'
  },
  'contact.email': {
    label: 'Email liên hệ',
    description: 'Hiển thị trong footer và form liên hệ.',
    group: 'contact'
  },
  'social.facebook': {
    label: 'Facebook URL',
    description: 'Link trang Facebook chính thức.',
    group: 'social'
  },
  'social.youtube': {
    label: 'YouTube URL',
    description: 'Link kênh YouTube.',
    group: 'social'
  },
  'social.tiktok': {
    label: 'TikTok URL',
    description: 'Link tài khoản TikTok.',
    group: 'social'
  },
  'analytics.ga4': {
    label: 'Google Analytics 4 ID',
    description: 'Mã đo lường GA4, ví dụ `G-XXXXXXX`.',
    group: 'analytics'
  },
  'analytics.fbPixel': {
    label: 'Facebook Pixel ID',
    description: 'Mã pixel Facebook để theo dõi chuyển đổi.',
    group: 'analytics'
  },
  'newsletter.substackUrl': {
    label: 'Substack URL',
    description: 'Link newsletter Substack hoặc nền tảng tương đương.',
    group: 'newsletter'
  },
  'seo.defaultTitle': {
    label: 'Tiêu đề SEO mặc định',
    description: 'Tiêu đề dùng khi một trang không tự đặt.',
    group: 'seo'
  },
  'seo.defaultDescription': {
    label: 'Mô tả SEO mặc định',
    description: 'Meta description mặc định cho các trang không tự đặt.',
    group: 'seo'
  },
  'seo.ogImage': {
    label: 'Open Graph image',
    description: 'Ảnh đại diện khi share lên mạng xã hội (1200×630).',
    group: 'seo'
  },
  'content.postsPerPage': {
    label: 'Số bài viết mỗi trang',
    description: 'Số bài hiển thị trên mỗi trang danh sách.',
    group: 'content'
  },
  'content.timezone': {
    label: 'Múi giờ',
    description: 'Múi giờ cho lịch đăng bài, ví dụ `Asia/Ho_Chi_Minh`.',
    group: 'content'
  }
};

export const GROUP_LABELS: Record<SettingMeta['group'], string> = {
  site: 'Site',
  contact: 'Liên hệ',
  social: 'Mạng xã hội',
  analytics: 'Analytics',
  newsletter: 'Newsletter',
  seo: 'SEO',
  content: 'Nội dung'
};