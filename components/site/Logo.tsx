import { clsx } from 'clsx';

type Tone = 'ink' | 'ondark';

type Props = {
  className?: string;
  tone?: Tone;
  /** Brand wordmark text. Defaults to "9ent". */
  text?: string;
  /** Show the small colored accent dot after the word. Defaults to true. */
  withDot?: boolean;
};

const TEXT_COLOR: Record<Tone, string> = {
  ink: 'text-ink',
  ondark: 'text-white'
};

const DOT_COLOR: Record<Tone, string> = {
  ink: 'bg-primary',
  ondark: 'bg-primary-ondark'
};

/**
 * 9ent-style wordmark rendered as HTML (text + colored accent dot).
 * HTML keeps the layout responsive to the brand length, which the previous
 * SVG-with-`<text>` could not do (truncated/clipped when brand was longer
 * than the static viewBox, e.g. "Đậu Đậu").
 *
 * `tone="ink"` → dark ink on light surfaces (default chrome).
 * `tone="ondark"` → white on the black GlobalNav.
 */
export function Logo({ className, tone = 'ink', text, withDot = true }: Props) {
  const brand = (text ?? '9ent').trim() || '9ent';
  return (
    <span
      role="img"
      aria-label={brand}
      className={clsx(
        'inline-flex items-baseline gap-[3px] font-sans font-semibold leading-none tracking-[-0.01em]',
        TEXT_COLOR[tone],
        className
      )}
    >
      <span className="text-[22px]">{brand}</span>
      {withDot && (
        <span
          aria-hidden="true"
          className={clsx(
            'inline-block h-[6px] w-[6px] translate-y-[2px] rounded-full',
            DOT_COLOR[tone]
          )}
        />
      )}
    </span>
  );
}
