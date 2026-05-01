import { NextResponse } from 'next/server';
import { getConcernSummaries } from '@/lib/categories/liveData';

export const revalidate = 60;

export async function GET() {
  const concerns = await getConcernSummaries(4);
  return NextResponse.json({ concerns }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=60' },
  });
}
