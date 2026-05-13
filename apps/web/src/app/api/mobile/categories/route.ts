import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/woocommerce';
import { sanitizeMobileCategory } from '@/lib/mobileApi';

export const runtime = 'nodejs';
export const revalidate = 300;

function numberParam(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function booleanParam(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === 'true' || value === '1';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parent = searchParams.has('parent')
    ? numberParam(searchParams.get('parent'), 0, 0, 100000)
    : undefined;

  const categories = await getCategories({
    per_page: numberParam(searchParams.get('per_page'), 100, 1, 100),
    parent,
    hide_empty: booleanParam(searchParams.get('hide_empty'), true),
  });

  return NextResponse.json(categories.map(sanitizeMobileCategory), {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' },
  });
}
