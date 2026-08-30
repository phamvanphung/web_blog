// components/site/MobileNav.tsx
// Right-side slide-in drawer for the public site header.
//
// Renders BOTH the hamburger trigger and the drawer panel from a single
// component so the open/close state is co-located (no prop drilling from
// GlobalNav, which stays a server component). On `md+` the trigger and the
// panel are `md:hidden` so desktop is unaffected.
//
// Mobile UX:
//   • Hamburger trigger visible only on mobile (`md:hidden`).
//   • Tap → backdrop fades in + panel slides in from the right.
//   • Backdrop tap, Escape key, or close-X button → closes.
//   • Body scroll is locked while open (position: fixed trick — survives iOS
//     Safari rubber-band). Scroll position is restored on close.
//   • First link in the panel is focused on open so keyboard users land on a
//     real control. Focus is restored to the hamburger on close.

'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

type Item = { href: string; label: string; openInNew?: boolean };

type Props = {
  items: Item[];
};

export function MobileNav({ items }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  // Body scroll lock — `position: fixed; top: -scrollY` is more reliable than
  // `overflow: hidden` on iOS Safari (which would still rubber-band scroll).
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const y = window.scrollY;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, y);
    };
  }, [open]);

  // Escape closes; restore focus to trigger.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Focus first link inside the panel when it opens.
  useEffect(() => {
    if (!open) return;
    // Defer to next tick so the panel is mounted before we search it.
    const id = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('a, button');
      first?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // Suppress hydration warning when the trigger is rendered server-side with
  // no matching open state on the client. Render-only — no behavioural effect.
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Mở menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-pill text-ink transition-colors hover:bg-canvas-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus md:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      {/* Backdrop — rendered as a button so it's keyboard-reachable too. */}
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={close}
          className="fixed inset-0 z-40 cursor-default bg-ink/40 backdrop-blur-sm motion-reduce:transition-none md:hidden"
        />
      )}

      {/* Panel — always rendered so the slide-out animation has a target. */}
      <aside
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-state={open ? 'open' : 'closed'}
        className="fixed right-0 top-0 z-50 flex h-dvh w-[min(85vw,360px)] translate-x-full flex-col border-l border-hairline bg-canvas shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden data-[state=open]:translate-x-0"
        // Hide from a11y tree when closed so screen-readers don't peek inside.
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="flex items-center justify-end px-4 pt-4">
          <Button
            type="button"
            variant="icon-circular"
            size="sm"
            aria-label="Đóng"
            onClick={close}
          >
            <Icon name="close" size={18} />
          </Button>
        </div>

        <nav aria-label="Chính" className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          <ul className="flex flex-col gap-1">
            {items.map((it, i) => (
              <li key={`${i}-${it.href}`}>
                <Link
                  href={it.href}
                  target={it.openInNew ? '_blank' : undefined}
                  rel={it.openInNew ? 'noopener noreferrer' : undefined}
                  onClick={close}
                  className="block rounded-8 px-3 py-3 text-[16px] text-ink-80 transition-colors hover:bg-canvas-parchment hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
