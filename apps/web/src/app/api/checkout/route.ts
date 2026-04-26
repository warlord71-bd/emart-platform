import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/woocommerce';
import { ensureCustomerByEmail } from '@/lib/customerAccounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_method, billing, shipping, line_items, customer_note } = body ?? {};

    if (!isNonEmptyString(payment_method)) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    if (!billing || !shipping || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json({ error: 'Incomplete checkout payload' }, { status: 400 });
    }

    if (!isNonEmptyString(billing.first_name) || !isNonEmptyString(billing.phone) || !isNonEmptyString(billing.address_1)) {
      return NextResponse.json({ error: 'Missing required billing information' }, { status: 400 });
    }

    if (!isValidEmail(billing.email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const customer = await ensureCustomerByEmail({
      email: billing.email,
      firstName: billing.first_name,
      lastName: billing.last_name,
    });

    const order = await createOrder({
      payment_method,
      billing: {
        ...billing,
        email: billing.email.trim().toLowerCase(),
      },
      shipping,
      line_items,
      customer_id: customer.id,
      customer_note: isNonEmptyString(customer_note) ? customer_note : undefined,
    });

    if (!order?.id) {
      return NextResponse.json({ error: 'Order creation failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Checkout failed. Please try again or contact support.';
    console.error('Checkout API error:', {
      message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    return NextResponse.json({ error: message }, { status: error?.response?.status || 500 });
  }
}
