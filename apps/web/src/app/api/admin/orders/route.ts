/**
 * GET /api/admin/orders
 *
 * Proxies WooCommerce order list to the dispatch dashboard.
 * Supports: ?status=processing&per_page=50&page=1
 *
 * Requires x-revalidate-secret header or ?token= query param.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/woocommerce';

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

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const status = params.get('status') || 'processing';
  const perPage = Math.min(Number(params.get('per_page') || '50'), 100);
  const page = Number(params.get('page') || '1');

  try {
    const orders = await getOrders({ status, per_page: perPage, page });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 502 });
  }
}
