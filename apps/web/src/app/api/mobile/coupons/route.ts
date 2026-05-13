import { NextRequest, NextResponse } from 'next/server';
import { getCouponsByCode } from '@/lib/woocommerce';
import { sanitizeMobileCoupon } from '@/lib/mobileApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  if (!code) {
    return NextResponse.json([], {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const coupons = await getCouponsByCode(code);

  return NextResponse.json(coupons.map(sanitizeMobileCoupon), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
