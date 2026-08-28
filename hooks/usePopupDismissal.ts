// hooks/usePopupDismissal.ts
// Persists "this popup has been dismissed" per-browser using a single
// localStorage key holding a JSON array of popup IDs.

'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'popup:dismissed';

function readDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeDismissed(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage full or disabled — best-effort.
  }
}

/**
 * Returns stable callbacks for reading and writing the dismissal set.
 *  - isDismissed(id): has this popup been dismissed?
 *  - dismiss(id): mark the popup as dismissed (no-op if already).
 *
 * SSR-safe: reads/writes are guarded with `typeof window`.
 */
export function usePopupDismissal() {
  const [set, setSet] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSet(readDismissed());
  }, []);

  const isDismissed = useCallback(
    (id: string) => set.has(id),
    [set]
  );

  const dismiss = useCallback((id: string) => {
    setSet((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      writeDismissed(next);
      return next;
    });
  }, []);

  return { isDismissed, dismiss };
}
