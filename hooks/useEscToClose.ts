// hooks/useEscToClose.ts
// Calls onClose when ESC is pressed AND `enabled` is true.

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
