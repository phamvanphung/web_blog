// hooks/useBodyScrollLock.ts
// Locks document.body scroll while any caller is active.
// Counter-based: only the first activate saves the previous overflow;
// only the last deactivate restores it. Safe for multiple popups open
// at once (the PopupLayer in components/site/PopupLayer.tsx drives this
// — each open popup calls the hook independently).

'use client';

import { useEffect, useRef } from 'react';

const PREV_OVERFLOW_KEY = '__bodyScrollLockPrev';

export function useBodyScrollLock(active: boolean): void {
  const countRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const body = document.body;
    const w = window as unknown as { [k: string]: string | undefined };
    if (countRef.current === 0) {
      w[PREV_OVERFLOW_KEY] = body.style.overflow;
      body.style.overflow = 'hidden';
    }
    countRef.current += 1;
    return () => {
      countRef.current -= 1;
      if (countRef.current === 0) {
        body.style.overflow = w[PREV_OVERFLOW_KEY] ?? '';
        w[PREV_OVERFLOW_KEY] = undefined;
      }
    };
  }, [active]);
}
