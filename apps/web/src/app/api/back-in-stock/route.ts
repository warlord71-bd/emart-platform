import { NextRequest } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart.com.bd';

type Body = {
  email?: unknown;
  product_id?: unknown;
  product_name?: unknown;
  product_slug?: unknown;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Body;
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const productId = typeof body.product_id === 'number' ? body.product_id : Number(body.product_id || 0);
  const productName = typeof body.product_name === 'string' ? body.product_name.trim().slice(0, 180) : '';
  const productSlug = typeof body.product_slug === 'string' ? body.product_slug.trim().slice(0, 140) : '';

  if (!email) {
    return Response.json({ success: false, error: 'email required' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ success: false, error: 'invalid email' }, { status: 400 });
  }
  if (!productId || !productName || !productSlug) {
    return Response.json({ success: false, error: 'product required' }, { status: 400 });
  }

  const res = await fetch(`${WP_URL}/wp-json/emart/v1/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      source: 'back-in-stock',
      product_id: productId,
      product_name: productName,
      product_slug: productSlug,
    }),
  });

  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  return Response.json({
    success: res.ok,
    back_in_stock: true,
    product_id: productId,
    data,
  }, { status: res.ok ? 200 : res.status });
}
