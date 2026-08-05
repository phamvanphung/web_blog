import type { ReactNode } from 'react';
import { clsx } from 'clsx';

type Width = 'prose' | 'narrow' | 'wide';

export function Container({
  children,
  width = 'wide',
  className
}: {
  children: ReactNode;
  width?: Width;
  className?: string;
}) {
  return <div className={clsx(`container-${width}`, className)}>{children}</div>;
}
