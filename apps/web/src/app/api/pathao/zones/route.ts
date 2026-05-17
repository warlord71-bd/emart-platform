import { NextRequest, NextResponse } from 'next/server';
import { getPathaoZones } from '@/lib/pathao';

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

/** GET /api/pathao/zones?city_id=NNN */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cityId = Number(req.nextUrl.searchParams.get('city_id'));
  if (!cityId) {
    return NextResponse.json({ error: 'city_id is required' }, { status: 400 });
  }
  try {
    const data = await getPathaoZones(cityId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 502 });
  }
}
