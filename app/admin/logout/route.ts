// app/admin/logout/route.ts
// POST /admin/logout — destroy session, clear cookie, redirect to /admin/login.

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { audit, hashIp } from '@/lib/audit';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'sid';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<Response> {
  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (sid) {
    const session = await db.session
      .findUnique({ where: { id: sid }, select: { userId: true } })
      .catch(() => null);
    await db.session.delete({ where: { id: sid } }).catch(() => {});
    if (session) {
      const h = await headers();
      const ip =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
      await audit({
        userId: session.userId,
        action: 'logout',
        ipHash: await hashIp(ip)
      });
      logger.info('logout', { userId: session.userId });
    }
  }
  jar.delete(COOKIE_NAME);
  redirect('/admin/login');
}

// Allow GET as a fallback (some crawlers / hand-shutdowns hit GET).
// In production we recommend POSTing from a form, but this avoids
// "Method not allowed" surprises for admins.
export async function GET(): Promise<Response> {
  return POST();
}