// modules/contact/server/index.ts
// Public contact form submission. Rate-limited per IP (3/hour).

'use server';

import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { hashIp } from '@/lib/audit';
import { ContactSchema } from '../schemas';

const RATE_BUCKET = 'contact:submit';

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; error: 'invalid' | 'rate_limited' | 'internal'; retryAfterSec?: number };

export async function submitContact(
  input: unknown,
  ctx: { ip: string | null; userAgent: string | null }
): Promise<SubmitResult> {
  const parsed = ContactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const ipHash = ctx.ip ? await hashIp(ctx.ip) : null;
  const rl = await rateLimit({
    bucket: RATE_BUCKET,
    key: ipHash ?? 'anon',
    limit: 3,
    windowSec: 3600
  });
  if (!rl.ok) return { ok: false, error: 'rate_limited', retryAfterSec: rl.retryAfterSec };

  try {
    const row = await db.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        subject: parsed.data.subject ?? null,
        message: parsed.data.message,
        ipHash,
        userAgent: ctx.userAgent?.slice(0, 500) ?? null
      }
    });
    return { ok: true, id: row.id };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('contact submit failed', e);
    return { ok: false, error: 'internal' };
  }
}
