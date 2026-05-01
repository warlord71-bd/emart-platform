import { NextResponse } from 'next/server';
import { getCategoryPulses } from '@/lib/categories/liveData';

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(16, Math.max(1, Number(searchParams.get('limit') || 8)));
  const categories = await getCategoryPulses(limit);
  return NextResponse.json({ categories }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=60' },
  });
}
