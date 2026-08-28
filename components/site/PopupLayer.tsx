// components/site/PopupLayer.tsx
// Orchestrator. Owns:
//  - per-popup open timers (driven by delaySeconds)
//  - localStorage dismissal state
//  - one global ESC listener
//  - body scroll lock when any popup is open
// Renders one PopupFrame per currently-open popup.

'use client';

import { useEffect, useState } from 'react';
import type { SerializedPopup } from '@/modules/popups/types';
import { PopupFrame } from './PopupFrame';
import { usePopupDismissal } from '@/hooks/usePopupDismissal';
import { useEscToClose } from '@/hooks/useEscToClose';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  popups: SerializedPopup[];
};

export function PopupLayer({ popups }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const { isDismissed, dismiss } = usePopupDismissal();

  // Schedule each non-dismissed popup to open after its delay.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const p of popups) {
      if (isDismissed(p.id)) continue;
      const t = setTimeout(() => {
        setOpenIds((prev) => {
          if (prev.has(p.id)) return prev;
          const next = new Set(prev);
          next.add(p.id);
          return next;
        });
      }, Math.max(0, p.delaySeconds) * 1000);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, [popups, isDismissed]);

  const topOpenId = popups.find((p) => openIds.has(p.id))?.id ?? null;

  useEscToClose(() => {
    if (topOpenId) handleClose(topOpenId);
  }, openIds.size > 0);
  useBodyScrollLock(openIds.size > 0);

  const handleClose = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const popup = popups.find((p) => p.id === id);
    if (popup && popup.frequency === 'ONCE') dismiss(id);
  };

  return (
    <>
      {popups.map((p) =>
        openIds.has(p.id) ? (
          <PopupFrame key={p.id} popup={p} onClose={() => handleClose(p.id)} />
        ) : null
      )}
    </>
  );
}
