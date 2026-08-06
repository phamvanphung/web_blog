import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { hashIp } from '@/lib/audit';
import { submitContact } from '@/modules/contact/server';

vi.mock('@/lib/db', () => ({ db: { contactSubmission: { create: vi.fn() } } }));
vi.mock('@/lib/rateLimit', () => ({ rateLimit: vi.fn() }));
vi.mock('@/lib/audit', () => ({ hashIp: vi.fn().mockResolvedValue('iph') }));

describe('submitContact', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists a ContactSubmission', async () => {
    (rateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    (db.contactSubmission.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c1' });
    const out = await submitContact(
      { name: 'N', email: 'a@b.com', message: 'm' },
      { ip: '1.2.3.4', userAgent: 'ua' }
    );
    expect(out.ok).toBe(true);
    expect(db.contactSubmission.create).toHaveBeenCalled();
  });

  it('rejects invalid email', async () => {
    const out = await submitContact(
      { name: 'N', email: 'not-an-email', message: 'm' },
      { ip: '1.2.3.4', userAgent: 'ua' }
    );
    expect(out.ok).toBe(false);
  });

  it('rejects when rate-limited', async () => {
    (rateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, retryAfterSec: 60 });
    const out = await submitContact(
      { name: 'N', email: 'a@b.com', message: 'm' },
      { ip: '1.2.3.4', userAgent: 'ua' }
    );
    expect(out.ok).toBe(false);
  });
});
