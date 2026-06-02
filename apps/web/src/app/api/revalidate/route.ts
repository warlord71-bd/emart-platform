import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const SITE_HOST = 'e-mart.com.bd';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'f388fee928b456a35b6b05ea5e34dbea';

async function pingIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // non-blocking — IndexNow failure must never break revalidation
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  // Accept either the legacy header or a ?token= query param (for WC webhooks)
  return (
    req.headers.get('x-revalidate-secret') === secret ||
    req.nextUrl.searchParams.get('token') === secret
  );
}

/**
 * POST /api/revalidate
 * Header: x-revalidate-secret: <REVALIDATE_SECRET>  (or ?token= query param)
 *
 * Body options:
 *   { slug, type: 'product' | 'category' }  — legacy WC webhook pattern
 *   { path: '/shop/some-slug' }             — revalidate any arbitrary path
 *   { tag: 'products' }                     — revalidate all pages with this cache tag
 *
 * WooCommerce webhook setup:
 *   Topic: Product updated / Product created
 *   URL: https://e-mart.com.bd/api/revalidate?token=<REVALIDATE_SECRET>
 *   Payload: { "slug": "<product-slug>", "type": "product" }
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: {
    id?: number;
    slug?: string;
    type?: 'product' | 'category';
    path?: string;
    tag?: string;
    permalink?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const { type, path, tag } = body;
  const slug = body.slug || body.permalink?.match(/\/product\/([^/]+)\/?$/)?.[1];
  const isProductWebhook = Boolean(slug && (type === 'product' || body.id || body.permalink));
  const revalidated: string[] = [];

  if (tag) {
    revalidateTag(tag);
    revalidated.push(`tag:${tag}`);
  } else if (path) {
    revalidatePath(path, 'page');
    revalidated.push(path);
  } else if (slug && isProductWebhook) {
    // Targeted: flush only this product's cache — not all 3,640 product list queries.
    // Category/brand list pages update within their 1hr ISR window (acceptable trade-off).
    revalidateTag(`product-${slug}`);
    revalidatePath(`/shop/${slug}`);
    revalidatePath('/shop');
    revalidated.push(`tag:product-${slug}`, `/shop/${slug}`, '/shop');
    void pingIndexNow([`https://${SITE_HOST}/shop/${slug}`]);
  } else if (slug && type === 'category') {
    // Category update: flush this category + shop listing, leave unrelated product caches intact.
    revalidatePath(`/category/${slug}`);
    revalidatePath('/shop');
    revalidateTag('products');
    revalidated.push(`/category/${slug}`, '/shop', 'tag:products');
    void pingIndexNow([`https://${SITE_HOST}/category/${slug}`]);
  } else {
    return NextResponse.json(
      { ok: false, error: 'provide tag, path, or slug+type' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, revalidated, at: new Date().toISOString() });
}

// GET for manual browser-triggered revalidation: /api/revalidate?token=<t>&path=/shop/xyz
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get('path');
  const tag = req.nextUrl.searchParams.get('tag');

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ ok: true, tag, at: new Date().toISOString() });
  }
  if (path) {
    revalidatePath(path, 'page');
    return NextResponse.json({ ok: true, path, at: new Date().toISOString() });
  }

  return NextResponse.json({ ok: false, error: 'provide path or tag' }, { status: 400 });
}
