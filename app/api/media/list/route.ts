import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { listMedia } from '@/modules/media/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await requireAuth();
  if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
    redirect('/admin/dashboard?denied=1');
  }
  const url = new URL(req.url);
  const take = Math.min(48, Math.max(1, Number(url.searchParams.get('take') ?? '24')));
  const skip = Math.max(0, Number(url.searchParams.get('skip') ?? '0'));
  const page = await listMedia({ take, skip });
  return NextResponse.json(page);
}
