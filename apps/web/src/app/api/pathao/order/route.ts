/**
 * POST /api/pathao/order
 *
 * Creates a Pathao courier consignment for an existing WooCommerce order,
 * then writes the consignment_id back to WooCommerce order meta.
 *
 * Request body:
 * {
 *   woo_order_id: number,       — WooCommerce order ID
 *   store_id: number,           — Pathao store ID (from /api/pathao/stores)
 *   recipient_city: number,     — Pathao city ID
 *   recipient_zone: number,     — Pathao zone ID
 *   item_weight?: number,       — kg, defaults to 0.5
 *   delivery_type?: number,     — 48 regular (default) | 12 express
 * }
 *
 * Requires x-admin-token header (ADMIN_API_TOKEN).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPathaoOrder } from '@/lib/pathao';
import { getOrder, updateOrder, addOrderNote } from '@/lib/woocommerce';
import { isAdminAuthorized } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    woo_order_id?: number;
    store_id?: number;
    recipient_city?: number;
    recipient_zone?: number;
    recipient_area?: number;
    item_weight?: number;
    delivery_type?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { woo_order_id, store_id, recipient_city, recipient_zone } = body;

  if (!woo_order_id || !store_id || !recipient_city || !recipient_zone) {
    return NextResponse.json(
      { error: 'woo_order_id, store_id, recipient_city, and recipient_zone are required' },
      { status: 400 },
    );
  }

  // 1. Fetch the WooCommerce order
  const order = await getOrder(woo_order_id);
  if (!order) {
    return NextResponse.json({ error: `WooCommerce order ${woo_order_id} not found` }, { status: 404 });
  }

  // 2. Prevent duplicate consignments
  const alreadyShipped = order.meta_data?.find((m) => m.key === '_pathao_consignment_id')?.value;
  if (alreadyShipped) {
    return NextResponse.json(
      { error: `Order ${woo_order_id} already has a Pathao consignment: ${alreadyShipped}` },
      { status: 409 },
    );
  }

  // 3. Build recipient info from WooCommerce order
  const shipping = order.shipping || order.billing;
  const recipientName = [shipping?.first_name, shipping?.last_name].filter(Boolean).join(' ')
    || order.billing?.first_name
    || 'Customer';
  const recipientPhone = order.billing?.phone || '';
  const recipientAddress = [shipping?.address_1, shipping?.address_2].filter(Boolean).join(', ')
    || order.billing?.address_1
    || '';

  if (!recipientPhone || !recipientAddress) {
    return NextResponse.json({ error: 'Order is missing phone or address' }, { status: 422 });
  }

  // 4. Determine amount to collect (COD = order total, prepaid = 0)
  const isCod = order.payment_method === 'cod';
  const amountToCollect = isCod ? Math.round(Number(order.total || 0)) : 0;

  // 5. Build item description from line items
  const itemDescription = (order.line_items || [])
    .slice(0, 3)
    .map((item: any) => `${item.name} x${item.quantity}`)
    .join(', ')
    .substring(0, 200);

  const totalQty = (order.line_items || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0);

  // 6. Call Pathao API
  try {
    const consignment = await createPathaoOrder({
      store_id,
      merchant_order_id: String(woo_order_id),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_address: recipientAddress,
      recipient_city,
      recipient_zone,
      recipient_area: body.recipient_area,
      delivery_type: body.delivery_type ?? 48,
      item_type: 2,
      item_quantity: totalQty,
      item_weight: body.item_weight ?? 0.5,
      item_description: itemDescription || 'Skincare products',
      amount_to_collect: amountToCollect,
    });

    // 7. Save consignment_id + tracking details back to WooCommerce
    await updateOrder(woo_order_id, {
      status: 'on-hold',
      meta_data: [
        { key: '_pathao_consignment_id', value: consignment.consignment_id },
        { key: '_emart_courier_name', value: 'Pathao' },
        { key: '_emart_tracking_code', value: consignment.consignment_id },
        { key: '_emart_tracking_url', value: `https://pathao.com/bn/track-shipment/?consignment_id=${consignment.consignment_id}` },
      ],
    });

    await addOrderNote(
      woo_order_id,
      `Pathao consignment created. ID: ${consignment.consignment_id}. Status: ${consignment.order_status}. Delivery fee: ৳${consignment.delivery_fee}.`,
      false,
    );

    return NextResponse.json({
      ok: true,
      woo_order_id,
      consignment_id: consignment.consignment_id,
      order_status: consignment.order_status,
      delivery_fee: consignment.delivery_fee,
      merchant_order_id: consignment.merchant_order_id,
    });
  } catch (error: any) {
    console.error('[Pathao] createPathaoOrder failed', { woo_order_id, error: error?.message });
    return NextResponse.json({ error: error?.message || 'Pathao order creation failed' }, { status: 502 });
  }
}
