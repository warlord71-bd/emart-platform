// src/app/api/orders/route.ts
// Server-side order creation — keeps WooCommerce credentials off the client

import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { payment_method, billing, shipping, line_items, customer_note } = body;

    if (!billing || !line_items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: billing, line_items' },
        { status: 400 }
      );
    }

    const order = await createOrder({
      payment_method,
      billing,
      shipping,
      line_items,
      customer_note,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
