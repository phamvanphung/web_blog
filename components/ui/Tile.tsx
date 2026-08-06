import type { ReactNode } from 'react';
import { clsx } from 'clsx';

type Tone = 'light' | 'parchment' | 'pearl' | 'dark' | 'black';

const TONE: Record<Tone, string> = {
  light: 'bg-canvas text-ink',
  parchment: 'bg-canvas-parchment text-ink',
  pearl: 'bg-canvas-pearl text-ink',
  dark: 'bg-tile-1 text-ink-ondark [&_a]:text-primary-ondark',
  black: 'bg-tile-black text-ink-ondark [&_a]:text-primary-ondark'
};

/** Full-bleed section band. By default edge-to-edge (no radius). */
export function Tile({
  tone = 'light',
  rounded = false,
  className,
  children
}: {
  tone?: Tone;
  rounded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={clsx(TONE[tone], rounded && 'rounded-18 overflow-hidden', className)}
    >
      {children}
    </section>
  );
}
