// components/site/ChatFloatingWidget.tsx
// Client Component. Wraps ChatButtons in a fixed bottom-right container
// for the floating widget. Why a Client Component: container itself is
// just CSS (fixed position), but the wrapper keeps the markup consistent
// with future enhancements (e.g. open/close animation) without changing
// the call site in app/(site)/layout.tsx.

'use client';

import { ChatButtons } from './ChatButtons';
import { buildZaloUrl, buildMessengerUrl } from '@/lib/chat-urls';

type Props = {
  zaloPhone: string | null;
  messengerPageId: string | null;
};

export function ChatFloatingWidget({ zaloPhone, messengerPageId }: Props) {
  // Mirror ChatButtons's null-return contract so no empty fixed-position
  // <div> lingers in the DOM when neither ID produces a usable URL.
  const zaloHref = buildZaloUrl(zaloPhone);
  const messengerHref = buildMessengerUrl(messengerPageId);
  if (!zaloHref && !messengerHref) return null;

  return (
    // z-30 sits above page content (auto/0) but below MobileNav backdrop
    // (z-40) and Header (z-50), so opening the mobile drawer correctly
    // covers the widget. Earlier z-40 collided with the backdrop and DOM
    // order (widget mounted after Header) meant chat buttons stayed
    // clickable through the dim layer.
    <div className="fixed bottom-6 right-6 z-30">
      <ChatButtons
        zaloPhone={zaloPhone}
        messengerPageId={messengerPageId}
        variant="floating"
      />
    </div>
  );
}