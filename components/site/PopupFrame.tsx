// components/site/PopupFrame.tsx
// Single popup: backdrop, iframe srcdoc, close X.

'use client';

import { useEffect, useRef } from 'react';
import type { SerializedPopup } from '@/modules/popups/types';

type Props = {
  popup: SerializedPopup;
  onClose: () => void;
};

export function PopupFrame({ popup, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the close button so screen readers + keyboard users land
    // on a known control. The iframe content is author-controlled
    // and not part of the host page's tab order.
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={popup.name}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      data-popup-id={popup.id}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Đóng popup"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60"
        tabIndex={-1}
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-[90vw] max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Đóng popup"
          onClick={onClose}
          className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg text-black shadow hover:bg-white"
        >
          ✕
        </button>

        <iframe
          srcDoc={popup.htmlContent}
          title={popup.name}
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
          className="block h-[80vh] w-full border-0"
        />
      </div>
    </div>
  );
}
