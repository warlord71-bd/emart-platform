import { NextResponse } from 'next/server';
import { getRecentPurchases } from '@/lib/categories/liveData';

export const revalidate = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') || 10)));
  const purchases = await getRecentPurchases(limit);
  return NextResponse.json({ purchases }, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=30' },
  });
}
