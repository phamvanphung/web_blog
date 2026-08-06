import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

// Legacy variants (primary / secondary / ghost) are retained as aliases so all
// 20+ existing call sites keep compiling. New code uses the Apple names.
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'primary-pill'
  | 'secondary-pill'
  | 'dark-utility'
  | 'pearl-capsule'
  | 'icon-circular';

export type ButtonSize = 'sm' | 'md' | 'lg';

export const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 font-sans font-normal ' +
  'transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus';

export const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  // Apple pills — the signature CTA grammar
  'primary-pill': 'rounded-pill bg-primary text-white hover:bg-primary-focus',
  'secondary-pill':
    'rounded-pill border border-primary text-primary hover:bg-primary hover:text-white',
  'dark-utility': 'rounded-8 bg-tile-1 text-ink-ondark hover:bg-tile-2',
  'pearl-capsule': 'rounded-pill bg-canvas-parchment text-ink hover:bg-chip',
  'icon-circular':
    'rounded-pill aspect-square p-0 bg-canvas-parchment text-ink hover:bg-chip',

  // Legacy aliases (unchanged behaviour, re-skinned through tokens)
  primary: 'rounded-pill bg-primary text-white hover:bg-primary-focus',
  secondary: 'rounded-pill border border-hairline text-ink hover:bg-canvas-parchment',
  ghost: 'rounded-8 text-primary hover:bg-canvas-parchment'
};

export const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-[14px]',
  md: 'h-11 px-md text-[15px]',
  lg: 'h-12 px-6 text-[17px]'
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Props) {
  // Fall back if a future variant slips through TS.
  const variantCls = BUTTON_VARIANT[variant] ?? BUTTON_VARIANT.primary;
  return (
    <button
      className={clsx(BUTTON_BASE, variantCls, BUTTON_SIZE[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
