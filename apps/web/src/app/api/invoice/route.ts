import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrder, type WooOrder } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeValue(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function normalizePhone(value?: string | null) {
  return (value || '').replace(/\D+/g, '');
}

function isAuthorized(order: WooOrder, identity: string, sessionUserId?: number, cookieUserId?: number) {
  const orderCustomerId = Number(order.customer_id || 0);
  if (sessionUserId && orderCustomerId && sessionUserId === orderCustomerId) return true;
  if (cookieUserId && orderCustomerId && cookieUserId === orderCustomerId) return true;

  const normalized = normalizeValue(identity);
  const normalizedPhone = normalizePhone(identity);
  return Boolean(
    normalized &&
    (
      normalized === normalizeValue(order.billing?.email) ||
      (normalizedPhone && normalizedPhone === normalizePhone(order.billing?.phone))
    )
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Order Placed',
    processing: 'Processing',
    'on-hold': 'Ready to Ship',
    completed: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return map[status] || status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = Number(searchParams.get('orderId'));
    const identity = searchParams.get('identity') || '';

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const [order, session, cookieStore] = await Promise.all([
      getOrder(orderId),
      getServerSession(authOptions),
      cookies(),
    ]);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const sessionUser = session?.user as { id?: number } | undefined;
    const cookieUser = cookieStore.get('wc_session');
    const parsedCookieUser = cookieUser?.value ? JSON.parse(cookieUser.value) as { id?: number } : undefined;

    if (!isAuthorized(order, identity, sessionUser?.id, parsedCookieUser?.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const billing = order.billing || {};
    const shipping = order.shipping || {};

    return NextResponse.json({
      order_id: order.id,
      date_created: order.date_created,
      status: order.status,
      status_label: statusLabel(order.status),
      payment_method_title: order.payment_method_title || 'N/A',
      total: order.total || '0',
      currency: order.currency || 'BDT',
      billing: {
        name: [billing.first_name, billing.last_name].filter(Boolean).join(' ') || 'N/A',
        email: billing.email || '',
        phone: billing.phone || '',
        address_1: billing.address_1 || '',
        address_2: billing.address_2 || '',
        city: billing.city || '',
        postcode: billing.postcode || '',
        country: billing.country || 'Bangladesh',
      },
      shipping: {
        name: [shipping.first_name, shipping.last_name].filter(Boolean).join(' ') ||
              [billing.first_name, billing.last_name].filter(Boolean).join(' ') || 'N/A',
        address_1: shipping.address_1 || billing.address_1 || '',
        address_2: shipping.address_2 || billing.address_2 || '',
        city: shipping.city || billing.city || '',
        postcode: shipping.postcode || billing.postcode || '',
        country: shipping.country || billing.country || 'Bangladesh',
      },
      line_items: (order.line_items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        total: item.total,
        unit_price: item.quantity > 0
          ? (parseFloat(item.total) / item.quantity).toFixed(2)
          : item.total,
      })),
    });
  } catch (error) {
    console.error('Invoice fetch failed:', error);
    return NextResponse.json({ error: 'Failed to load invoice' }, { status: 500 });
  }
}
