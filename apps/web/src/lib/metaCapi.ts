import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import type { WooBilling, WooOrder } from './woocommerce';

const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '763041131179021';
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const META_CAPI_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || '';
const META_CAPI_API_VERSION = process.env.META_CAPI_API_VERSION || 'v21.0';

type MetaCapiUserData = {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  ct?: string[];
  zp?: string[];
  country?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
};

type MetaCapiContent = Partial<{
  id: string;
  quantity: number;
  item_price: number;
}>;

function sha256(value?: unknown): string | undefined {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function hashArray(value?: unknown): string[] | undefined {
  const hashed = sha256(value);
  return hashed ? [hashed] : undefined;
}

function cleanPhone(value?: unknown): string {
  return String(value || '').replace(/[^\d]/g, '');
}

function cleanPrice(value?: unknown): number | undefined {
  const parsed = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : undefined;
}

function sumPrices(values: unknown[]): number | undefined {
  const total = values.reduce<number>((sum, value) => sum + (cleanPrice(value) || 0), 0);
  return total > 0 ? Number(total.toFixed(2)) : undefined;
}

function getClientIp(request: NextRequest): string | undefined {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('cf-connecting-ip') || request.ip || undefined;
}

function getCookie(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value;
}

function buildUserData(request: NextRequest, billing: WooBilling, order: WooOrder): MetaCapiUserData {
  return {
    em: hashArray(billing.email),
    ph: hashArray(cleanPhone(billing.phone)),
    fn: hashArray(billing.first_name),
    ln: hashArray(billing.last_name),
    ct: hashArray(billing.city),
    zp: hashArray(billing.postcode),
    country: hashArray(billing.country),
    external_id: hashArray(order.customer_id || order.id),
    client_ip_address: getClientIp(request),
    client_user_agent: request.headers.get('user-agent') || undefined,
    fbp: getCookie(request, '_fbp'),
    fbc: getCookie(request, '_fbc'),
  };
}

function compactObject<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }),
  ) as Partial<T>;
}

export async function sendMetaPurchaseEvent({
  request,
  order,
  eventId,
}: {
  request: NextRequest;
  order: WooOrder;
  eventId: string;
}) {
  if (!META_CAPI_ACCESS_TOKEN || !META_PIXEL_ID) {
    return { skipped: true, reason: 'missing_meta_capi_config' };
  }

  const value = cleanPrice(order.total);
  const origin = request.headers.get('origin') || 'https://e-mart.com.bd';
  const eventSourceUrl = `${origin.replace(/\/$/, '')}/order-success?id=${order.id}`;
  const contents = (order.line_items || []).map((item) => {
    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    const total = cleanPrice(item.total);
    const itemPrice = total ? Number((total / quantity).toFixed(2)) : undefined;

    return compactObject({
      id: String(item.product_id || item.id),
      quantity,
      item_price: itemPrice,
    });
  });
  const recoveredValue = value || sumPrices([
    ...(order.line_items || []).map((item) => item.total),
    ...((order as WooOrder & { shipping_lines?: Array<{ total?: unknown }> }).shipping_lines || []).map((item) => item.total),
  ]);

  if (!recoveredValue) {
    return { skipped: true, reason: 'missing_purchase_value' };
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: 'website',
        user_data: compactObject(buildUserData(request, order.billing, order)),
        custom_data: compactObject({
          currency: order.currency || 'BDT',
          value: recoveredValue,
          order_id: String(order.id),
          content_type: 'product',
          content_ids: contents.map((item: MetaCapiContent) => item.id).filter(Boolean),
          contents,
          num_items: contents.reduce((sum, item: MetaCapiContent) => sum + Number(item.quantity || 0), 0),
        }),
      },
    ],
    ...(META_CAPI_TEST_EVENT_CODE ? { test_event_code: META_CAPI_TEST_EVENT_CODE } : {}),
  };

  const url = `https://graph.facebook.com/${META_CAPI_API_VERSION}/${META_PIXEL_ID}/events`;
  const response = await fetch(`${url}?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Meta CAPI Purchase failed', {
      status: response.status,
      error: result?.error?.message || result,
      orderId: order.id,
    });
  }

  return {
    ok: response.ok,
    status: response.status,
    events_received: result?.events_received,
    messages: result?.messages,
    fbtrace_id: result?.fbtrace_id || result?.error?.fbtrace_id,
  };
}
