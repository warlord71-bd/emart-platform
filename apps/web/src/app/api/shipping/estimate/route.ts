import { NextRequest, NextResponse } from 'next/server';
import { calculateLineItemsSubtotal, getShippingQuote } from '@/lib/woocommerce';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const city = typeof body?.city === 'string' ? body.city : 'Dhaka';
    const lineItems = Array.isArray(body?.line_items) ? body.line_items : [];
    const subtotal = await calculateLineItemsSubtotal(lineItems);
    const quote = await getShippingQuote(city, subtotal);

    return NextResponse.json({ success: true, subtotal, quote }, { status: 200 });
  } catch (error: any) {
    console.error('Shipping estimate error:', {
      message: error?.message || 'Unknown shipping estimate error',
    });

    return NextResponse.json({ error: 'Could not calculate shipping' }, { status: 500 });
  }
}
