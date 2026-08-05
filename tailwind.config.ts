import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './modules/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        fg: 'var(--color-fg)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        line: 'var(--color-line)'
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif']
      },
      maxWidth: {
        prose: '68ch',
        narrow: '44rem',
        wide: '72rem'
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem'
      }
    }
  },
  plugins: []
};

export default config;
