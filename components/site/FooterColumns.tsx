// components/site/FooterColumns.tsx
// Per-column disclosure for the public footer.
//
// On mobile each column collapses behind a button trigger (chevron + title).
// On `md+` the trigger renders the same `<h3>` as the original server markup
// and the link list is always expanded — desktop behaviour matches the prior
// 4-col grid exactly.
//
// Animation is pure CSS via `grid-rows-[0fr]` / `grid-rows-[1fr]` — no
// max-height hard-coding, no JS measuring. The inner `<div className="min-h-0">`
// is what lets the grid row collapse cleanly (without it `min-height: auto`
// wins and the list stays visible).

'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export type FooterColumn = {
  title: string;
  links: { href: string; label: string }[];
};

type Props = {
  columns: FooterColumn[];
};

/**
 * Renders the link columns as 3 sibling grid items — direct children of the
 * parent's `<Container>` grid. Do NOT wrap in a `<div>` or the parent grid
 * stops seeing the columns.
 */
export function FooterColumns({ columns }: Props) {
  return (
    <>
      {columns.map((col, i) => (
        <FooterColumn key={col.title} column={col} idSuffix={i} />
      ))}
    </>
  );
}

function FooterColumn({ column, idSuffix }: { column: FooterColumn; idSuffix: number }) {
  // Start closed on mobile (CSS-only — on md+ the grid-row is forced open).
  const [open, setOpen] = useState(false);
  const panelId = `footer-col-${idSuffix}`;

  return (
    <div className="text-[13px]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48 transition-colors hover:text-ink md:pointer-events-none md:cursor-default md:py-0 md:text-ink-48"
      >
        {column.title}
        <Icon
          name="chevron-down"
          className={`h-4 w-4 shrink-0 transition-transform duration-200 md:hidden ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Mobile: grid-rows-[0fr] / [1fr] for smooth height animation. */}
      {/* Desktop (md+): override to grid-rows-[1fr] so the list is always visible. */}
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none md:grid-rows-[1fr] ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden md:overflow-visible">
          <ul className="space-y-3 leading-snug text-ink-80">
            {column.links.map((l) => (
              <li key={`${l.href}-${l.label}`}>
                <a
                  href={l.href}
                  className="hover:text-primary"
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
