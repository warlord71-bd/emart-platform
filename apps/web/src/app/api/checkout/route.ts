import { NextRequest, NextResponse } from 'next/server';
import { calculateLineItemsSubtotal, createOrderViaPlugin, getShippingQuote } from '@/lib/woocommerce';
import { ensureCustomerByEmail } from '@/lib/customerAccounts';
import { sendMetaPurchaseEvent } from '@/lib/metaCapi';
import { checkoutStockErrorMessage, normalizeStockAvailability } from '@/lib/stock';
import { getCheckoutErrorResponse } from '@/lib/checkoutErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Attribution helper ────────────────────────────────────────────────────────

function buildAttributionMeta(attribution: Record<string, unknown> | undefined | null): { key: string; value: string }[] {
  if (!attribution) return [];
  const meta: { key: string; value: string }[] = [];

  const first = attribution.first_touch as Record<string, string> | undefined;
  const last  = attribution.last_touch  as Record<string, string> | undefined;

  const add = (key: string, value: string | undefined) => {
    if (value) meta.push({ key, value });
  };

  // First-touch (where the customer originally came from)
  if (first) {
    add('_attr_first_source',   first.utm_source);
    add('_attr_first_medium',   first.utm_medium);
    add('_attr_first_campaign', first.utm_campaign);
    add('_attr_first_content',  first.utm_content);
    add('_attr_first_term',     first.utm_term);
    add('_attr_first_gclid',    first.gclid);
    add('_attr_first_fbclid',   first.fbclid);
    add('_attr_first_referrer', first.referrer);
    add('_attr_first_landing',  first.landing_page);
    if (first.ts) add('_attr_first_ts', new Date(Number(first.ts)).toISOString());
  }

  // Last-touch (what drove the actual purchase)
  if (last) {
    add('_attr_last_source',   last.utm_source);
    add('_attr_last_medium',   last.utm_medium);
    add('_attr_last_campaign', last.utm_campaign);
    add('_attr_last_content',  last.utm_content);
    add('_attr_last_term',     last.utm_term);
    add('_attr_last_gclid',    last.gclid);
    add('_attr_last_fbclid',   last.fbclid);
    add('_attr_last_referrer', last.referrer);
    add('_attr_last_landing',  last.landing_page);
    if (last.ts) add('_attr_last_ts', new Date(Number(last.ts)).toISOString());
  }

  return meta;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_method,
      payment_method_title,
      billing,
      shipping,
      line_items,
      coupon_lines,
      customer_note,
      meta_event_id,
      attribution,
      idempotency_key,
    } = body ?? {};

    if (!isNonEmptyString(payment_method)) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    if (!billing || !shipping || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json({ error: 'Incomplete checkout payload' }, { status: 400 });
    }
    if (line_items.length > 50) {
      return NextResponse.json({ error: 'Too many items in cart' }, { status: 400 });
    }
    for (const item of line_items) {
      const qty = Number(item?.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
      }
    }

    if (!isNonEmptyString(billing.first_name) || !isNonEmptyString(billing.phone) || !isNonEmptyString(billing.address_1)) {
      return NextResponse.json({ error: 'Missing required billing information' }, { status: 400 });
    }

    if (!isValidEmail(billing.email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const { customer, isNew: isNewCustomer } = await ensureCustomerByEmail({
      email: billing.email,
      firstName: billing.first_name,
      lastName: billing.last_name,
    });

    const couponLines = Array.isArray(coupon_lines)
      ? coupon_lines
        .map((item) => ({ code: String(item?.code || '').trim() }))
        .filter((item) => item.code)
      : [];
    // Verify live stock server-side. Cart/localStorage product objects can be stale.
    const stockChecks = await Promise.all(
      line_items.map(async (item: { product_id: number; variation_id?: number; quantity: number }) => {
        const { getProductById: getProduct } = await import('@/lib/woocommerce');
        const productId = Number(item.product_id);
        const variationId = Number(item.variation_id || 0);
        const product = await getProduct(productId);
        const variation = variationId && variationId !== productId ? await getProduct(variationId) : null;
        if (!product || (variationId && variationId !== productId && !variation)) {
          const deferred = {
            available: true,
            reason: 'deferred_to_order_endpoint',
            name: `Product #${variationId || productId}`,
            product_id: productId,
            ...(variationId ? { variation_id: variationId } : {}),
          };
          console.error('[checkout-stock] Woo REST product fetch unavailable; deferring to order endpoint', deferred);
          return deferred;
        }
        const availability = normalizeStockAvailability(product, Number(item.quantity), variation);
        if (!availability.available) {
          console.error('[checkout-stock] unavailable line item', availability);
        }
        return availability;
      })
    );
    const outOfStock = stockChecks.find((c) => !c.available);
    if (outOfStock) {
      return NextResponse.json({ error: checkoutStockErrorMessage(outOfStock) }, { status: 409 });
    }

    const subtotal = await calculateLineItemsSubtotal(line_items);
    const shippingQuote = await getShippingQuote(shipping?.city || billing?.city || 'Dhaka', subtotal);

    const order = await createOrderViaPlugin({
      payment_method,
      payment_method_title: isNonEmptyString(payment_method_title) ? payment_method_title.trim() : undefined,
      billing: {
        ...billing,
        email: billing.email.trim().toLowerCase(),
      },
      shipping,
      line_items,
      shipping_lines: [{
        method_id: shippingQuote.methodId,
        method_title: shippingQuote.methodTitle,
        total: String(shippingQuote.total),
      }],
      customer_id: customer.id,
      customer_note: isNonEmptyString(customer_note) ? customer_note : undefined,
      coupon_lines: couponLines.length > 0 ? couponLines : undefined,
      meta_data: [
        ...buildAttributionMeta(attribution),
        // Idempotency key — prevents duplicate orders on retry/double-submit
        ...(isNonEmptyString(idempotency_key)
          ? [{ key: '_idempotency_key', value: idempotency_key.trim().slice(0, 64) }]
          : []),
      ],
    });

    if (!order?.id) {
      return NextResponse.json({ error: 'Order creation failed' }, { status: 502 });
    }

    const metaEventId = isNonEmptyString(meta_event_id)
      ? meta_event_id.trim()
      : `emart-purchase-${order.id}`;

    try {
      await sendMetaPurchaseEvent({ request, order, eventId: metaEventId });
    } catch (error: any) {
      console.error('Meta CAPI Purchase exception', {
        orderId: order.id,
        message: error?.message || 'Unknown Meta CAPI error',
      });
    }

    // New customer from guest checkout — send password reset so they can access order history
    if (isNewCustomer) {
      const WP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart.com.bd';
      fetch(`${WP_URL}/wp-json/emart/v1/customer/lost-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: billing.email.trim().toLowerCase() }),
      }).catch(() => {
        // Fire-and-forget — don't block order response if email fails
      });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error('Checkout API error:', {
      message: error?.response?.data?.error || error?.response?.data?.message || error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    const { message, status } = getCheckoutErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
