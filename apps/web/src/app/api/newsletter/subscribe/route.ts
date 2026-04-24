import { NextRequest } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart.com.bd';

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== 'string') {
    return Response.json({ success: false, error: 'email required' }, { status: 400 });
  }

  const res = await fetch(`${WP_URL}/wp-json/emart/v1/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return Response.json(data, { status: res.status });
}
