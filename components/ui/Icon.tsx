// components/ui/Icon.tsx
// Inline SVG icon library. Stroke-based (currentColor) — recolor via the
// surrounding `text-*` utility. No runtime cost, no third-party dependency.

import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'post'
  | 'page'
  | 'category'
  | 'tag'
  | 'media'
  | 'menu'
  | 'contact'
  | 'user'
  | 'settings'
  | 'audit'
  | 'megaphone'
  | 'palette'
  | 'close'
  | 'chevron-down';

const PATHS: Record<IconName, string> = {
  // Dashboard — 4 tiles / squares
  dashboard:
    '<rect x="3" y="3" width="7" height="9" rx="1.5"></rect>' +
    '<rect x="14" y="3" width="7" height="5" rx="1.5"></rect>' +
    '<rect x="14" y="12" width="7" height="9" rx="1.5"></rect>' +
    '<rect x="3" y="16" width="7" height="5" rx="1.5"></rect>',

  // Post — document with horizontal lines
  post:
    '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>' +
    '<path d="M14 3v6h6"></path>' +
    '<path d="M8 13h8M8 17h6"></path>',

  // Page — single sheet
  page:
    '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>' +
    '<path d="M14 3v6h6"></path>',

  // Category — stacked tags
  category:
    '<path d="M20.6 13.4 12 22l-8.6-8.6a2 2 0 0 1 0-2.8L10 4h8a2 2 0 0 1 2 2v3.4z"></path>' +
    '<circle cx="15" cy="9" r="1.2"></circle>',

  // Tag — hashtag / label
  tag:
    '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"></path>' +
    '<path d="M7 7h.01"></path>',

  // Media — image / mountain + sun
  media:
    '<rect x="3" y="4" width="18" height="16" rx="2"></rect>' +
    '<circle cx="9" cy="9" r="1.5"></circle>' +
    '<path d="m21 16-5-5-5 5-3-3-5 5"></path>',

  // Menu — three horizontal lines + bullets
  menu:
    '<path d="M4 6h12"></path>' +
    '<circle cx="20" cy="6" r="1.4" fill="currentColor"></circle>' +
    '<path d="M4 12h12"></path>' +
    '<circle cx="20" cy="12" r="1.4" fill="currentColor"></circle>' +
    '<path d="M4 18h12"></path>' +
    '<circle cx="20" cy="18" r="1.4" fill="currentColor"></circle>',

  // Contact — envelope
  contact:
    '<rect x="3" y="5" width="18" height="14" rx="2"></rect>' +
    '<path d="m3 7 9 6 9-6"></path>',

  // User — single person
  user:
    '<circle cx="12" cy="8" r="4"></circle>' +
    '<path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"></path>',

  // Settings — gear
  settings:
    '<circle cx="12" cy="12" r="3"></circle>' +
    '<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>',

  // Audit — clipboard with checkmarks
  audit:
    '<rect x="6" y="4" width="12" height="18" rx="2"></rect>' +
    '<path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"></path>' +
    '<path d="m9 12 2 2 4-4"></path>',

  // Megaphone — bullhorn / announcement
  megaphone:
    '<path d="M3 11l19-9-9 19-2-8-8-2z"></path>',

  // Palette — color theme (CMS theme picker)
  palette:
    '<circle cx="12" cy="12" r="9"></circle>' +
    '<circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"></circle>' +
    '<circle cx="12" cy="7.5" r="1.2" fill="currentColor"></circle>' +
    '<circle cx="16.5" cy="10.5" r="1.2" fill="currentColor"></circle>' +
    '<path d="M12 21a4 4 0 0 0 0-8h-1a2 2 0 0 1 0-4 4 4 0 0 0 4-4"></path>',

  // Close — X (mobile drawer / dialogs)
  close:
    '<path d="M6 6l12 12"></path>' +
    '<path d="M18 6 6 18"></path>',

  // Chevron down — disclosure / accordion trigger
  'chevron-down':
    '<path d="m6 9 6 6 6-6"></path>',
};

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

/**
 * Inline SVG icon. Stroke uses `currentColor` — recolor via className.
 * Defaults to 18px / stroke 1.6 (Apple-style hairline).
 */
export function Icon({
  name,
  size = 18,
  strokeWidth = 1.6,
  className,
  ...rest
}: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
      {...rest}
    />
  );
}
