// components/site/ChatButtons.tsx
// Server Component. Renders 0/1/2 chat-channel anchor buttons using
// HTTPS Universal Links. Two visual variants:
//   - 'inline'   → pill buttons with icon + label, used on /lien-he
//   - 'floating' → icon-only brand-logo images (the logos carry their own
//                  background; no separate button bg needed)
//
// Returns null when neither ID produces a usable URL so callers don't
// have to wrap in a conditional.
//
// `bare` prop: when true (only meaningful with `variant="inline"`),
// returns a Fragment of buttons without a wrapper div. This lets callers
// embed the chat buttons as siblings inside their own flex row — e.g.
// the contact form's action area, alongside the Submit button — instead
// of stacking them below. Each button gets `flex-1` so it shares the
// row width equally with the Submit button.

import { Icon } from '@/components/ui/Icon';
import { buildZaloUrl, buildMessengerUrl } from '@/lib/chat-urls';

export type ChatVariant = 'inline' | 'floating';

type Props = {
  zaloPhone: string | null;
  messengerPageId: string | null;
  variant: ChatVariant;
  bare?: boolean;
};

const ZALO_LOGO_SRC = '/chat/zalo-logo.png';
const MESSENGER_LOGO_SRC = '/chat/messenger-logo.png';

export function ChatButtons({
  zaloPhone,
  messengerPageId,
  variant,
  bare = false
}: Props) {
  const zaloHref = buildZaloUrl(zaloPhone);
  const messengerHref = buildMessengerUrl(messengerPageId);

  if (!zaloHref && !messengerHref) return null;

  const isInline = variant === 'inline';

  const zaloButton = zaloHref ? (
    isInline ? (
      <a
        key="zalo"
        href={zaloHref}
        target="_blank"
        rel="noopener noreferrer"
        className={
          bare
            ? 'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-pill bg-[#0068FF] px-md text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0068FF]'
            : 'inline-flex h-11 items-center gap-2 rounded-pill bg-[#0068FF] px-md text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0068FF]'
        }
      >
        <Icon name="zalo" size={18} />
        <span>Chat Zalo</span>
        <span className="sr-only">Chat qua Zalo</span>
      </a>
    ) : (
      <a
        key="zalo"
        href={zaloHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat qua Zalo"
        className="block transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0068FF]"
      >
        <img
          src={ZALO_LOGO_SRC}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12"
        />
      </a>
    )
  ) : null;

  const messengerButton = messengerHref ? (
    isInline ? (
      <a
        key="messenger"
        href={messengerHref}
        target="_blank"
        rel="noopener noreferrer"
        className={
          bare
            ? 'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-pill px-md text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
            : 'inline-flex h-11 items-center gap-2 rounded-pill px-md text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
        }
        style={{
          background: 'linear-gradient(135deg, #0084FF 0%, #C03FFF 100%)'
        }}
      >
        <Icon name="messenger" size={18} />
        <span>Chat Messenger</span>
        <span className="sr-only">Chat qua Messenger</span>
      </a>
    ) : (
      <a
        key="messenger"
        href={messengerHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat qua Messenger"
        className="block transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <img
          src={MESSENGER_LOGO_SRC}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12"
        />
      </a>
    )
  ) : null;

  if (bare) {
    return (
      <>
        {zaloButton}
        {messengerButton}
      </>
    );
  }

  const wrapperClass = isInline ? 'flex flex-wrap gap-3' : 'flex flex-col gap-3';

  return (
    <div className={wrapperClass}>
      {zaloButton}
      {messengerButton}
    </div>
  );
}
