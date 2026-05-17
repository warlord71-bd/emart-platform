import { NextRequest, NextResponse } from 'next/server';
import { getPathaoCities } from '@/lib/pathao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  return (
    req.headers.get('x-revalidate-secret') === secret ||
    req.nextUrl.searchParams.get('token') === secret
  );
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await getPathaoCities();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 502 });
  }
}
