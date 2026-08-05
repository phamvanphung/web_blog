import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';

describe('password hashing (argon2id)', () => {
  it('hashes a plaintext password and verifies the round trip', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects wrong passwords', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('incorrect', hash)).toBe(false);
  });

  it('produces different hashes for the same input (salt uniqueness)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});
