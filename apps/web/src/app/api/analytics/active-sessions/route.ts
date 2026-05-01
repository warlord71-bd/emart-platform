import { NextResponse } from 'next/server';
import { getActiveSessions } from '@/lib/categories/liveData';

export const revalidate = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('category_id') || undefined;
  const data = await getActiveSessions(categoryId);
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=30' },
  });
}
