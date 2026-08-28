// modules/popups/server/match.ts
// Pure matcher: does this popup match the given pathname?
// No DB access, no I/O — easy to unit-test.

import type { Popup } from '@prisma/client';

/**
 * Returns true if the popup should be shown for this pathname.
 *  - DRAFT popups never match.
 *  - Soft-deleted popups never match.
 *  - ALL trigger matches every pathname.
 *  - HOMEPAGE trigger matches only the bare root path '/'.
 *  - PATH trigger matches when pathname is exactly in triggerPaths.
 */
export function matches(popup: Popup, pathname: string): boolean {
  if (popup.status !== 'PUBLISHED') return false;
  if (popup.deletedAt !== null) return false;
  switch (popup.triggerType) {
    case 'ALL':
      return true;
    case 'HOMEPAGE':
      return pathname === '/';
    case 'PATH': {
      if (!Array.isArray(popup.triggerPaths)) return false;
      return (popup.triggerPaths as unknown[]).includes(pathname);
    }
  }
}
