import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
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
