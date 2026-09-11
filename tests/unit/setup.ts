// tests/unit/setup.ts
// Vitest setup — runs before every unit test. Mocks the Next.js cache layer
// (`unstable_cache`, `revalidatePath`, `revalidateTag`) so tests can import
// helpers that wrap them without needing the full Next incremental cache.
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('next/cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/cache')>();
  return {
    ...actual,
    // Identity wrapper — `unstable_cache(fn, ...)()` becomes `fn()`.
    unstable_cache: <T extends (...a: unknown[]) => unknown>(fn: T) => fn,
    revalidatePath: () => undefined,
    revalidateTag: () => undefined
  };
});

// Unmount any React components rendered during a test. Without this, the
// DOM from one test leaks into the next and `getByRole` returns stale nodes
// (the second render's link gets folded on top of the first).
afterEach(() => {
  cleanup();
});

// Extend Vitest with @testing-library/jest-dom matchers (`toBeInTheDocument`,
// `toHaveAttribute`, etc.). Imported here so every test file gets them.
import '@testing-library/jest-dom/vitest';
