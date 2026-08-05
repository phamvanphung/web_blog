import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const variantClass: Record<Variant, string> = {
  primary: 'bg-fg text-bg hover:opacity-90',
  secondary: 'border border-line text-fg hover:bg-line/40',
  ghost: 'text-fg hover:bg-line/30'
};
const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm'
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-none font-ui transition',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
