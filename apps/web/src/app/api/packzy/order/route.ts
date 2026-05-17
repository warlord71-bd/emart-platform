/**
 * POST /api/packzy/order
 *
 * Creates a Packzy courier consignment for an existing WooCommerce order,
 * then writes the tracking details back to WooCommerce order meta.
 *
 * Body: { woo_order_id: number, note?: string }
 * Requires x-revalidate-secret header or ?token= query param.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPackzyOrder } from '@/lib/packzy';
import { getOrder, updateOrder, addOrderNote } from '@/lib/woocommerce';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  return (
    req.headers.get('x-revalidate-secret') === secret ||
    req.nextUrl.searchParams.get('token') === secret
  );
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { woo_order_id?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { woo_order_id, note } = body;
  if (!woo_order_id) {
    return NextResponse.json({ error: 'woo_order_id is required' }, { status: 400 });
  }

  const order = await getOrder(woo_order_id);
  if (!order) {
    return NextResponse.json({ error: `Order ${woo_order_id} not found` }, { status: 404 });
  }

  const alreadyShipped = order.meta_data?.find(
    (m) => m.key === '_packzy_consignment_id' || m.key === '_pathao_consignment_id',
  )?.value;
  if (alreadyShipped) {
    return NextResponse.json(
      { error: `Order ${woo_order_id} already has a courier consignment: ${alreadyShipped}` },
      { status: 409 },
    );
  }

  const shipping = order.shipping || order.billing;
  const recipientName =
    [shipping?.first_name, shipping?.last_name].filter(Boolean).join(' ') || 'Customer';
  const recipientPhone = order.billing?.phone || '';
  const recipientAddress =
    [shipping?.address_1, shipping?.address_2, shipping?.city].filter(Boolean).join(', ') ||
    order.billing?.address_1 ||
    '';

  if (!recipientPhone || !recipientAddress) {
    return NextResponse.json({ error: 'Order is missing phone or address' }, { status: 422 });
  }

  const isCod = order.payment_method === 'cod';
  const codAmount = isCod ? Math.round(Number(order.total || 0)) : 0;

  const itemDescription =
    note ||
    (order.line_items || [])
      .slice(0, 3)
      .map((item: any) => `${item.name} x${item.quantity}`)
      .join(', ')
      .substring(0, 200);

  try {
    const consignment = await createPackzyOrder({
      invoice: String(woo_order_id),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_address: recipientAddress.substring(0, 250),
      cod_amount: codAmount,
      note: itemDescription || 'Skincare products',
    });

    const trackingUrl = `https://packzy.com/tracking/${consignment.tracking_code}`;

    await updateOrder(woo_order_id, {
      status: 'on-hold',
      meta_data: [
        { key: '_packzy_consignment_id', value: String(consignment.consignment_id) },
        { key: '_emart_courier_name', value: 'Steadfast' },
        { key: '_emart_tracking_code', value: consignment.tracking_code },
        { key: '_emart_tracking_url', value: trackingUrl },
      ],
    });

    await addOrderNote(
      woo_order_id,
      `Steadfast consignment created. Tracking: ${consignment.tracking_code}. Status: ${consignment.status}. COD: ৳${codAmount}.`,
      false,
    );

    return NextResponse.json({
      ok: true,
      woo_order_id,
      consignment_id: consignment.consignment_id,
      tracking_code: consignment.tracking_code,
      tracking_url: trackingUrl,
      status: consignment.status,
    });
  } catch (error: any) {
    console.error('[Packzy] createPackzyOrder failed', { woo_order_id, error: error?.message });
    return NextResponse.json({ error: error?.message || 'Packzy order creation failed' }, { status: 502 });
  }
}
