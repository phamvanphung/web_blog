// hooks/useBodyScrollLock.ts
// Locks document.body scroll while `active` is true. Idempotent across
// multiple callers — only the first activate changes overflow.

'use client';

import { useEffect, useRef } from 'react';

const PREV_OVERFLOW_KEY = '__bodyScrollLockPrev';

export function useBodyScrollLock(active: boolean): void {
  const isFirstActivateRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    if (typeof document === 'undefined') return;
    const body = document.body;
    const w = window as unknown as { [k: string]: string | undefined };
    if (!isFirstActivateRef.current) {
      w[PREV_OVERFLOW_KEY] = body.style.overflow;
      body.style.overflow = 'hidden';
      isFirstActivateRef.current = true;
    }
    return () => {
      if (isFirstActivateRef.current) {
        body.style.overflow = w[PREV_OVERFLOW_KEY] ?? '';
        w[PREV_OVERFLOW_KEY] = undefined;
        isFirstActivateRef.current = false;
      }
    };
  }, [active]);
}
