'use client';

// ThemeForm — 8 picker rows (native color input + hex text field mirror each
// other), one "Lưu theme" button saves all 8 atomically. The reset button
// lives OUTSIDE the save form (HTML disallows nested <form>s) and reloads
// the pickers with the defaults the server just wrote.

import { useActionState, useEffect, useState } from 'react';
import { saveThemeAction, resetThemeAction, type ThemeFormState } from './actions';
import { THEME_KEYS, THEME_LABELS, type ThemeKey } from '@/modules/settings/types';
import { DEFAULT_THEME_HEX, HEX_REGEX } from '@/modules/settings/theme-defaults';
import { ThemeSwatch } from './ThemeSwatch';
import { Button } from '@/components/ui/Button';

type Props = {
  initial: Record<ThemeKey, string>;
};

export function ThemeForm({ initial }: Props) {
  const [colors, setColors] = useState<Record<ThemeKey, string>>(initial);
  const [saveState, saveAction, savePending] = useActionState<ThemeFormState | undefined, FormData>(
    saveThemeAction,
    undefined
  );
  // Lifted to the parent so we can sync `colors` after a successful reset
  // (mirror CategoryRow.tsx:36-38 pattern). Previously lived inside the
  // ResetButton child where the parent couldn't see the state.
  const [resetState, resetAction, resetPending] = useActionState<ThemeFormState | undefined, FormData>(
    resetThemeAction,
    undefined
  );

  function update(key: ThemeKey, raw: string) {
    setColors((prev) => ({ ...prev, [key]: raw }));
  }

  // After a successful reset, snap local state back to the defaults the
  // server just wrote. Without this, pickers keep showing the user's old
  // colors until the next mount (useState's `initial` is read once).
  useEffect(() => {
    if (resetState?.ok === true) setColors(DEFAULT_THEME_HEX);
  }, [resetState]);

  return (
    <>
      <form action={saveAction} className="space-y-8">
        <ThemeSwatch
          primary={colors['theme.primary']}
          surfaceCanvas={colors['theme.surface.canvas']}
          surfaceDark={colors['theme.surface.dark']}
        />

        <div className="space-y-4">
          {THEME_KEYS.map((key) => {
            const meta = THEME_LABELS[key];
            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-11 border border-hairline p-5 md:flex-row md:items-center md:gap-6"
              >
                <div className="md:w-64">
                  <label htmlFor={`picker-${key}`} className="block text-[14px] font-medium text-ink">
                    {meta.label}
                  </label>
                  <p className="mt-0.5 text-[12px] text-ink-80">{meta.description}</p>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <input
                    id={`picker-${key}`}
                    type="color"
                    name={key}
                    value={colors[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-8 border border-hairline"
                    aria-label={`${meta.label} — color picker`}
                  />
                  <input
                    type="text"
                    value={colors[key]}
                    onChange={(e) => update(key, e.target.value)}
                    pattern={HEX_REGEX.source}
                    className="w-32 rounded-8 border border-hairline px-3 py-2 font-mono text-[13px]"
                    aria-label={`${meta.label} — hex value`}
                  />
                  <div
                    className="h-8 w-8 rounded-8 border border-hairline"
                    style={{ backgroundColor: colors[key] }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {saveState?.ok === false && (
          <p role="alert" className="text-error">
            {saveState.error}
          </p>
        )}
        {saveState?.ok === true && (
          <p role="status" className="text-success">
            Đã lưu theme. Site repaint ở request kế tiếp.
          </p>
        )}

        <Button type="submit" variant="primary-pill" disabled={savePending}>
          {savePending ? 'Đang lưu...' : 'Lưu theme'}
        </Button>
      </form>

      {/* Reset form lives OUTSIDE the save form. HTML disallows nested <form>s
          (the parser drops the inner tag), and we want the reset button to
          submit resetThemeAction — not saveThemeAction with the current
          picker values. */}
      <div className="mt-4 flex items-center gap-3">
        <form action={resetAction} data-testid="reset-theme-form">
          <Button type="submit" variant="ghost" disabled={resetPending}>
            {resetPending ? 'Đang khôi phục...' : 'Khôi phục mặc định'}
          </Button>
        </form>
        {resetState?.ok === true && (
          <p
            role="status"
            data-testid="reset-theme-status"
            className="text-success"
          >
            Đã khôi phục 8 màu về tokens.css.
          </p>
        )}
        {resetState?.ok === false && (
          <p role="alert" className="text-error">
            {resetState.error}
          </p>
        )}
      </div>
    </>
  );
}