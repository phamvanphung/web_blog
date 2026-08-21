export type SettingKey =
  | 'site.name'
  | 'site.tagline'
  | 'site.logo'
  | 'site.favicon'
  | 'site.homeHref'
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
  | 'content.timezone';

export type SettingsMap = Partial<Record<SettingKey, string>>;
