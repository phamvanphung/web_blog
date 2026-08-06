type Tone = 'ink' | 'ondark';

type Props = {
  className?: string;
  tone?: Tone;
  /** Brand wordmark text. Defaults to "9ent". */
  text?: string;
};

/**
 * 9ent-style wordmark rendered inline so the colors follow the consuming
 * surface. `tone="ink"` → dark ink on light surfaces; `tone="ondark"` →
 * white on the black GlobalNav. `text` is the brand name read from the
 * `Setting` table (lib/brand.ts).
 */
export function Logo({ className = '', tone = 'ink', text }: Props) {
  const siteName = (text ?? '9ent').trim() || '9ent';
  const ink = tone === 'ondark' ? '#FFFFFF' : '#1D1D1F';
  const dot = tone === 'ondark' ? '#2997FF' : '#0066CC';

  // Wordmark renders the supplied text. Dot is a visual accent — kept as a
  // constant brand mark rather than a dynamic character.
  return (
    <svg
      viewBox="0 0 120 32"
      width="120"
      height="32"
      role="img"
      aria-label={siteName}
      className={className}
    >
      <text
        x="0"
        y="24"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="24"
        fontWeight="600"
        letterSpacing="-0.5"
        fill={ink}
      >
        {siteName}
      </text>
      <circle cx="106" cy="16" r="3" fill={dot} />
    </svg>
  );
}
