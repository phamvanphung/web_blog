// components/site/ChatButtons.tsx
// Server Component. Renders 0/1/2 chat-channel anchor buttons using
// HTTPS Universal Links. Two visual variants:
//   - 'inline'   → pill buttons with icon + label, used on /lien-he
//   - 'floating' → icon-only round buttons stacked bottom-right
//
// Returns null when neither ID produces a usable URL so callers don't
// have to wrap in a conditional.

import { Icon } from '@/components/ui/Icon';
import { buildZaloUrl, buildMessengerUrl } from '@/lib/chat-urls';

export type ChatVariant = 'inline' | 'floating';

type Props = {
  zaloPhone: string | null;
  messengerPageId: string | null;
  variant: ChatVariant;
};

export function ChatButtons({ zaloPhone, messengerPageId, variant }: Props) {
  const zaloHref = buildZaloUrl(zaloPhone);
  const messengerHref = buildMessengerUrl(messengerPageId);

  if (!zaloHref && !messengerHref) return null;

  const isInline = variant === 'inline';
  const wrapperClass = isInline
    ? 'mt-8 flex flex-wrap gap-3'
    : 'flex flex-col gap-3';

  return (
    <div className={wrapperClass}>
      {zaloHref && (
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isInline
              ? 'inline-flex h-11 items-center gap-2 rounded-pill bg-[#0068FF] px-md text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0068FF]'
              : 'inline-flex h-12 w-12 items-center justify-center rounded-pill bg-[#0068FF] text-white shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0068FF]'
          }
        >
          <Icon name="zalo" size={isInline ? 18 : 22} />
          {isInline && <span>Chat Zalo</span>}
          <span className="sr-only">Chat qua Zalo</span>
        </a>
      )}
      {messengerHref && (
        <a
          href={messengerHref}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isInline
              ? 'inline-flex h-11 items-center gap-2 rounded-pill px-md text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
              : 'inline-flex h-12 w-12 items-center justify-center rounded-pill text-white shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          }
          style={{
            background: 'linear-gradient(135deg, #0084FF 0%, #C03FFF 100%)'
          }}
        >
          <Icon name="messenger" size={isInline ? 18 : 22} />
          {isInline && <span>Chat Messenger</span>}
          <span className="sr-only">Chat qua Messenger</span>
        </a>
      )}
    </div>
  );
}
