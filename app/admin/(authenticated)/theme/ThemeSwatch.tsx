'use client';

// ThemeSwatch — 2-band preview showing how the current color picks combine.
// Recomputes derived tokens (focus/hover) client-side using the same
// deriveFocus algorithm as the server, so previews stay in sync with what
// will actually be rendered after save.

import { deriveFocus } from '@/lib/color';
import type { ThemeKey } from '@/modules/settings/types';

type Props = {
  primary: string;
  surfaceCanvas: string;
  surfaceDark: string;
};

export function ThemeSwatch({ primary, surfaceCanvas, surfaceDark }: Props) {
  const primaryFocus = deriveFocus(primary);
  return (
    <div className="overflow-hidden rounded-11 border border-hairline">
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 text-[13px]"
        style={{ backgroundColor: surfaceCanvas, color: surfaceDark }}
      >
        <span className="font-semibold" style={{ color: surfaceDark }}>
          Nền sáng
        </span>
        <button
          type="button"
          className="rounded-pill px-4 py-1.5 text-[13px] font-medium text-white"
          style={{ backgroundColor: primary }}
        >
          Primary
        </button>
        <button
          type="button"
          className="rounded-pill px-4 py-1.5 text-[13px] font-medium text-white"
          style={{ backgroundColor: primaryFocus }}
        >
          Primary focus
        </button>
      </div>
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 text-[13px]"
        style={{ backgroundColor: surfaceDark, color: surfaceCanvas }}
      >
        <span className="font-semibold">Nền tối</span>
        <span className="opacity-70">Surface dark</span>
      </div>
    </div>
  );
}

export type _ThemeKey = ThemeKey; // re-export to silence unused import lint
