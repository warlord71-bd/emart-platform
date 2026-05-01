import { NextResponse } from 'next/server';
import { getFlashProducts, getTrendingProducts } from '@/lib/categories/liveData';

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(24, Math.max(1, Number(searchParams.get('limit') || 12)));
  const promotion = searchParams.get('promotion');
  const products = promotion === 'flash'
    ? await getFlashProducts(limit)
    : await getTrendingProducts(limit);
  return NextResponse.json({ products }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=60' },
  });
}
