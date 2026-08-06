import type { ReactNode } from 'react';
import { clsx } from 'clsx';

type Width = 'prose' | 'narrow' | 'wide' | 'xl' | 'full';

// Static mapping keeps Tailwind's class scanner able to detect every emitted
// class. A template literal (`container-${width}`) would compile fine but
// silently break the moment someone moves these widths into tailwind.config.ts.
const WIDTH: Record<Width, string> = {
  prose: 'container-prose',
  narrow: 'container-narrow',
  wide: 'container-wide',
  xl: 'mx-auto max-w-[88rem] px-6',
  full: 'w-full px-0' // full-bleed: no max-width, no inline gutter
};

export function Container({
  children,
  width = 'wide',
  className
}: {
  children: ReactNode;
  width?: Width;
  className?: string;
}) {
  return <div className={clsx(WIDTH[width], className)}>{children}</div>;
}
