import type { ReactNode } from 'react';
import { clsx } from 'clsx';

type Width = 'prose' | 'narrow' | 'wide';

// Static mapping keeps Tailwind's class scanner able to detect every emitted
// class. A template literal (`container-${width}`) would compile fine but
// silently break the moment someone moves these widths into tailwind.config.ts.
const WIDTH: Record<Width, string> = {
  prose: 'container-prose',
  narrow: 'container-narrow',
  wide: 'container-wide'
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
