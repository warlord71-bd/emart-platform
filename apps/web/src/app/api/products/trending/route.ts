import { NextResponse } from 'next/server';
import { getTrendingProducts } from '@/lib/categories/liveData';

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(12, Math.max(1, Number(searchParams.get('limit') || 4)));
  const products = await getTrendingProducts(limit);
  return NextResponse.json({ products }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=60' },
  });
}
