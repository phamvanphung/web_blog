// components/site/ChatFloatingWidget.tsx
// Client Component. Wraps ChatButtons in a fixed bottom-right container
// for the floating widget. Why a Client Component: container itself is
// just CSS (fixed position), but the wrapper keeps the markup consistent
// with future enhancements (e.g. open/close animation) without changing
// the call site in app/(site)/layout.tsx.

'use client';

import { ChatButtons } from './ChatButtons';

type Props = {
  zaloPhone: string | null;
  messengerPageId: string | null;
};

export function ChatFloatingWidget({ zaloPhone, messengerPageId }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <ChatButtons
        zaloPhone={zaloPhone}
        messengerPageId={messengerPageId}
        variant="floating"
      />
    </div>
  );
}