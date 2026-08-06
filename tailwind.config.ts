import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './modules/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy aliases — kept until the cleanup pass. Resolved via CSS vars.
        bg: 'var(--color-bg)',
        fg: 'var(--color-fg)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        line: 'var(--color-line)',

        // Apple system palette
        primary: {
          DEFAULT: 'var(--color-primary)',
          focus: 'var(--color-primary-focus)',
          ondark: 'var(--color-primary-on-dark)'
        },
        canvas: {
          DEFAULT: 'var(--color-canvas)',
          parchment: 'var(--color-canvas-parchment)',
          pearl: 'var(--color-surface-pearl)'
        },
        tile: {
          1: 'var(--color-surface-tile-1)',
          2: 'var(--color-surface-tile-2)',
          3: 'var(--color-surface-tile-3)',
          black: 'var(--color-surface-black)'
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          80: 'var(--color-ink-muted-80)',
          48: 'var(--color-ink-muted-48)',
          ondark: 'var(--color-body-on-dark)',
          dim: 'var(--color-body-muted)'
        },
        hairline: 'var(--color-hairline)',
        divider: 'var(--color-divider-soft)',
        chip: 'var(--color-surface-chip-translucent)'
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        ui: ['var(--font-sans)'],
        heading: ['var(--font-sans)']
      },
      fontSize: {
        body: ['17px', { lineHeight: '1.47', letterSpacing: '-0.374px' }],
        'd-sm': ['34px', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '600' }],
        'd-md': ['40px', { lineHeight: '1.08', letterSpacing: '-0.015em', fontWeight: '600' }],
        'd-lg': ['56px', { lineHeight: '1.05', letterSpacing: '-0.022em', fontWeight: '600' }]
      },
      spacing: {
        fine: '3px',
        md: '17px',
        section: '80px',
        nav: '44px',
        subnav: '52px',
        4.5: '1.125rem',
        5.5: '1.375rem',
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem'
      },
      borderRadius: {
        5: '5px',
        8: '8px',
        11: '11px',
        18: '18px',
        pill: '9999px'
      },
      maxWidth: {
        prose: '68ch',
        narrow: '44rem',
        wide: '72rem'
      }
    }
  },
  plugins: []
};

export default config;
