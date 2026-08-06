type Tone = 'ink' | 'ondark';

/**
 * 9ent wordmark rendered inline so the colors follow the consuming surface.
 * `tone="ink"` → dark ink on light surfaces (footer, hero, login card).
 * `tone="ondark"` → white on the black GlobalNav.
 */
export function Logo({
  className = '',
  tone = 'ink'
}: {
  className?: string;
  tone?: Tone;
}) {
  const text = tone === 'ondark' ? '#FFFFFF' : '#1D1D1F';
  const dot = tone === 'ondark' ? '#2997FF' : '#0066CC';
  return (
    <svg
      viewBox="0 0 120 32"
      width="120"
      height="32"
      role="img"
      aria-label="9ent"
      className={className}
    >
      <text
        x="0"
        y="24"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="24"
        fontWeight="600"
        letterSpacing="-0.5"
        fill={text}
      >
        9ent
      </text>
      <circle cx="106" cy="16" r="3" fill={dot} />
    </svg>
  );
}
