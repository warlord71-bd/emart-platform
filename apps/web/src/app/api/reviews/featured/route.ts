import { NextResponse } from 'next/server';
import { getFeaturedReviews } from '@/lib/categories/liveData';

export const revalidate = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(6, Math.max(1, Number(searchParams.get('limit') || 3)));
  const reviews = await getFeaturedReviews(limit);
  return NextResponse.json({ reviews }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' },
  });
}
