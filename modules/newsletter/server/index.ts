'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { hashIp } from '@/lib/audit';
import { rateLimit } from '@/lib/rateLimit';
import { db } from '@/lib/db';

const NewsletterSchema = z.object({
  email: z.string().email().max(200),
});

export type NewsletterResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'rate_limited'; retryAfterSec?: number };

export async function submitNewsletter(
  _prev: NewsletterResult | undefined,
  formData: FormData
): Promise<NewsletterResult> {
  const parsed = NewsletterSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
  });
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  const ipHash = ip ? await hashIp(ip) : null;
  const rl = await rateLimit({
    bucket: 'newsletter:subscribe',
    key: ipHash ?? 'anon',
    limit: 5,
    windowSec: 3600,
  });
  if (!rl.ok) return { ok: false, error: 'rate_limited', retryAfterSec: rl.retryAfterSec };

  await db.newsletterSubscription.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, ipHash },
    update: {},
  });

  return { ok: true };
}
