// tests/unit/setup.ts
// Vitest setup — runs before every unit test. Mocks the Next.js cache layer
// (`unstable_cache`, `revalidatePath`, `revalidateTag`) so tests can import
// helpers that wrap them without needing the full Next incremental cache.
import { vi } from 'vitest';

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
