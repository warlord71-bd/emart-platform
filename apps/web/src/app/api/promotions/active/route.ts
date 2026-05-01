import { NextResponse } from 'next/server';
import { getActiveFlashPromotion } from '@/lib/categories/liveData';

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'flash_week';
  const promotion = getActiveFlashPromotion();
  return NextResponse.json({ promotions: type === promotion.type ? [promotion] : [] }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=60' },
  });
}
