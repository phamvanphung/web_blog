import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { listMedia } from '@/modules/media/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  await requireRole('ADMIN');
  const url = new URL(req.url);
  const take = Math.min(48, Math.max(1, Number(url.searchParams.get('take') ?? '24')));
  const skip = Math.max(0, Number(url.searchParams.get('skip') ?? '0'));
  const page = await listMedia({ take, skip });
  return NextResponse.json(page);
}
