import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrder, getOrderNotes, type WooOrder, type WooOrderNote } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeValue(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function normalizePhone(value?: string | null) {
  return (value || '').replace(/\D+/g, '');
}

function getMetaValue(order: WooOrder, key: string) {
  return order.meta_data?.find((item) => item.key === key)?.value;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Order Placed',
    processing: 'Processing',
    'on-hold': 'Ready to Ship',
    completed: 'Delivered',
    cancelled: 'Cancelled',
    failed: 'Payment Failed',
    refunded: 'Refunded',
  };
  return map[status] || status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusDescription(status: string) {
  const map: Record<string, string> = {
    pending: 'Your order has been received and is waiting for confirmation.',
    processing: 'Your order is confirmed and being prepared for dispatch.',
    'on-hold': 'Your order is packed and waiting for courier handover.',
    completed: 'Your order has been delivered successfully.',
    cancelled: 'This order was cancelled.',
    failed: 'Payment failed for this order.',
    refunded: 'This order has been refunded.',
  };
  return map[status] || 'Your order is being updated.';
}

function getStepState(order: WooOrder, step: 'placed' | 'processing' | 'shipped' | 'completed') {
  const status = order.status;
  const hasTracking = Boolean(getMetaValue(order, '_emart_tracking_code'));

  if (step === 'placed') return true;
  if (step === 'processing') return !['pending', 'failed', 'cancelled'].includes(status);
  if (step === 'shipped') return hasTracking || status === 'completed';
  if (step === 'completed') return status === 'completed';
  return false;
}

function buildTimeline(order: WooOrder, notes: WooOrderNote[]) {
  const shippedNote = notes.find((note) => /tracking|courier|shipment|dispatch/i.test(note.note));
  const completedNote = notes.find((note) => /delivered|completed/i.test(note.note));

  return [
    {
      status: 'pending',
      status_label: 'Order Placed',
      date: order.date_created,
      description: 'Your order has been received.',
    },
    {
      status: 'processing',
      status_label: 'Processing',
      date: getStepState(order, 'processing') ? order.date_modified || order.date_created : '',
      description: 'We are confirming items and preparing the package.',
    },
    {
      status: 'shipped',
      status_label: 'Shipped',
      date: getStepState(order, 'shipped') ? shippedNote?.date_created || order.date_modified || order.date_created : '',
      description: 'Tracking details have been prepared for courier handover.',
    },
    {
      status: 'completed',
      status_label: 'Delivered',
      date: getStepState(order, 'completed') ? completedNote?.date_created || order.date_modified || order.date_created : '',
      description: 'The shipment has been marked as delivered.',
    },
  ];
}

function buildUpdates(notes: WooOrderNote[]) {
  return notes
    .filter((note) => note.customer_note || /tracking|courier|status|delivered|processing|shipped/i.test(note.note))
    .slice(0, 10)
    .map((note) => ({
      id: note.id,
      date: note.date_created,
      note: note.note.replace(/<[^>]+>/g, '').trim(),
    }));
}

function isAuthorized(order: WooOrder, providedIdentity: string, sessionUserId?: number, cookieUserId?: number) {
  const orderCustomerId = Number(order.customer_id || 0);
  if (sessionUserId && orderCustomerId && sessionUserId === orderCustomerId) {
    return true;
  }

  if (cookieUserId && orderCustomerId && cookieUserId === orderCustomerId) {
    return true;
  }

  const normalized = normalizeValue(providedIdentity);
  const normalizedPhone = normalizePhone(providedIdentity);

  return Boolean(
    normalized &&
    (
      normalized === normalizeValue(order.billing?.email) ||
      (normalizedPhone && normalizedPhone === normalizePhone(order.billing?.phone))
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = Number(body?.orderId);
    const identity = typeof body?.identity === 'string' ? body.identity : '';

    if (!orderId) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    const [order, notes, session, cookieStore] = await Promise.all([
      getOrder(orderId),
      getOrderNotes(orderId),
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
      return NextResponse.json({ error: 'Order not found for the provided email or phone' }, { status: 404 });
    }

    const trackingNumber = String(getMetaValue(order, '_emart_tracking_code') || '');
    const courier = String(getMetaValue(order, '_emart_courier_name') || '');
    const trackingUrl = String(getMetaValue(order, '_emart_tracking_url') || '');
    const estimatedDelivery = String(getMetaValue(order, '_emart_estimated_delivery') || '');

    return NextResponse.json({
      order_id: order.id,
      status: order.status,
      status_label: statusLabel(order.status),
      status_description: statusDescription(order.status),
      date_created: order.date_created,
      estimated_delivery: estimatedDelivery || undefined,
      tracking_number: trackingNumber || undefined,
      tracking_url: trackingUrl || undefined,
      courier: courier || undefined,
      shipping_address: {
        address_1: order.shipping?.address_1 || order.billing?.address_1 || '',
        city: order.shipping?.city || order.billing?.city || '',
        postcode: order.shipping?.postcode || order.billing?.postcode || '',
        country: order.shipping?.country || order.billing?.country || 'Bangladesh',
      },
      timeline: buildTimeline(order, notes),
      updates: buildUpdates(notes),
    });
  } catch (error) {
    console.error('Track order failed:', error);
    return NextResponse.json({ error: 'Failed to load tracking' }, { status: 500 });
  }
}
