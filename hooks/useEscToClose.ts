// hooks/useEscToClose.ts
// Calls onClose when ESC is pressed AND `enabled` is true.
//
// NOTE: the effect depends on `onClose`, so callers MUST memoize it
// (e.g. `useCallback` or a stable ref) — otherwise the listener will
// detach and re-attach on every parent render.

'use client';

import { useEffect } from 'react';

export function useEscToClose(onClose: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, enabled]);
}
