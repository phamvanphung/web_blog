import type { ReactNode } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  BUTTON_BASE,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  type ButtonSize,
  type ButtonVariant
} from './Button';

type Props = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
};

// Polished `<a>` styled as an Apple pill/CTA. Use for hero tiles and anywhere
// a CTAs acts as navigation; use <Button> for form submits and toggles.
export function ButtonLink({
  href,
  variant = 'primary-pill',
  size = 'md',
  className,
  children,
  prefetch
}: Props) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={clsx(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)}
    >
      {children}
    </Link>
  );
}
