'use client';

// ThemeForm — 8 picker rows (native color input + hex text field mirror each
// other), one "Lưu theme" button saves all 8 atomically. The reset button
// hits resetThemeAction and reloads the form with defaults.

import { useActionState, useState } from 'react';
import { saveThemeAction, resetThemeAction, type ThemeFormState } from './actions';
import { THEME_KEYS, THEME_LABELS, type ThemeKey } from '@/modules/settings/types';
import { ThemeSwatch } from './ThemeSwatch';
import { Button } from '@/components/ui/Button';

type Props = {
  initial: Record<ThemeKey, string>;
};

export function ThemeForm({ initial }: Props) {
  const [colors, setColors] = useState<Record<ThemeKey, string>>(initial);
  const [state, formAction, pending] = useActionState<ThemeFormState | undefined, FormData>(
    saveThemeAction,
    undefined
  );

  function update(key: ThemeKey, raw: string) {
    setColors((prev) => ({ ...prev, [key]: raw }));
  }

  return (
    <form action={formAction} className="space-y-8">
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
                  pattern="^#[0-9a-f]{6}$"
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

      {state?.ok === false && (
        <p role="alert" className="text-error">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p role="status" className="text-success">
          Đã lưu theme. Site repaint ở request kế tiếp.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary-pill" disabled={pending}>
          {pending ? 'Đang lưu...' : 'Lưu theme'}
        </Button>
        <ResetButton />
      </div>
    </form>
  );
}

function ResetButton() {
  // Separate component so its own useActionState doesn't reset the save form's state.
  // `resetThemeAction` ignores formData — it always pulls from DEFAULT_THEME_HEX.
  const [state, action, pending] = useActionState<ThemeFormState | undefined, FormData>(
    resetThemeAction,
    undefined
  );
  return (
    <form action={action}>
      <Button type="submit" variant="ghost" disabled={pending}>
        {pending ? 'Đang khôi phục...' : 'Khôi phục mặc định'}
      </Button>
      {state?.ok === true && (
        <span className="ml-3 text-success">Đã khôi phục 8 màu về tokens.css.</span>
      )}
      {state?.ok === false && (
        <span className="ml-3 text-error">{state.error}</span>
      )}
    </form>
  );
}
