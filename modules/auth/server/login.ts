// modules/auth/server/login.ts
// Credentials check, rate limiting, session creation, audit.

import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { createLimiter } from '@/lib/rateLimit';
import { createSession } from './session';
import { logger } from '@/lib/logger';

const Credentials = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200)
});

// One limiter: 5 attempts / 15 minutes per IP key.
const attemptsLimiter = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

export type LoginResult =
  { ok: true } | { ok: false; code: 'invalid' | 'throttled' | 'disabled'; message: string };

export async function attemptLogin(args: {
  email: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<LoginResult> {
  const ipKey = args.ip ?? 'unknown';

  // Throttle before even running the query.
  if (!attemptsLimiter.check(ipKey)) {
    await audit({
      action: 'login.throttled',
      ipHash: await hashIp(args.ip),
      metadata: { email: args.email }
    });
    return {
      ok: false,
      code: 'throttled',
      message: 'Quá nhiều lần đăng nhập thất bại. Thử lại sau vài phút.'
    };
  }

  const parsed = Credentials.safeParse({ email: args.email, password: args.password });
  if (!parsed.success) {
    attemptsLimiter.record(ipKey);
    return { ok: false, code: 'invalid', message: 'Email hoặc mật khẩu không đúng.' };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() }
  });
  if (!user || user.status !== 'ACTIVE') {
    attemptsLimiter.record(ipKey);
    await audit({
      action: 'login.failed',
      ipHash: await hashIp(args.ip),
      metadata: { email: args.email, reason: 'unknown_user' }
    });
    return { ok: false, code: 'invalid', message: 'Email hoặc mật khẩu không đúng.' };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    attemptsLimiter.record(ipKey);
    await audit({
      userId: user.id,
      action: 'login.failed',
      ipHash: await hashIp(args.ip),
      metadata: { reason: 'bad_password' }
    });
    return { ok: false, code: 'invalid', message: 'Email hoặc mật khẩu không đúng.' };
  }

  // Success — create session + bump lastLoginAt.
  await createSession({
    userId: user.id,
    ip: args.ip,
    userAgent: args.userAgent
  });
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  // Note: limiter state is sliding-window per IP. We do not reset on success
  // because (a) we don't know which IP key belongs to the successful user in
  // a multi-tenant scenario and (b) old entries will age out within 15 min.
  await audit({
    userId: user.id,
    action: 'login.success',
    ipHash: await hashIp(args.ip)
  });
  logger.info('login.success', { userId: user.id });
  return { ok: true };
}
