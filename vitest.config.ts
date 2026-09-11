import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // Vite 8 ships OXC as the default JS/TS transformer but its defaults
  // preserve JSX, which then breaks rolldown's SSR parser when a `.tsx`
  // test file is loaded. Force the automatic JSX runtime so OXC emits
  // `react/jsx-runtime` calls instead of leaving `<Foo/>` syntax in place.
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/lib/**/*.test.ts'],
    // Load .env so modules that read DATABASE_URL at import time (lib/db.ts)
    // don't throw when tests don't pass env explicitly.
    setupFiles: ['dotenv/config', 'tests/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['modules/**', 'lib/**']
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') }
  }
});
