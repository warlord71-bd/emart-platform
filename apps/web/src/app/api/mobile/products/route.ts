import { NextRequest, NextResponse } from 'next/server';
import { getProducts, type ProductsParams } from '@/lib/woocommerce';
import { sanitizeMobileProduct } from '@/lib/mobileApi';

export const runtime = 'nodejs';
export const revalidate = 60;

const PRODUCT_ORDERBYS: ProductsParams['orderby'][] = ['date', 'price', 'popularity', 'rating', 'title', 'include'];
const PRODUCT_ORDERS: ProductsParams['order'][] = ['asc', 'desc'];
const STOCK_STATUSES: NonNullable<ProductsParams['stock_status']>[] = ['instock', 'outofstock', 'onbackorder'];

function numberParam(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function booleanParam(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  return value === 'true' || value === '1';
}

function stringParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderby = stringParam(searchParams.get('orderby')) as ProductsParams['orderby'] | undefined;
  const order = stringParam(searchParams.get('order')) as ProductsParams['order'] | undefined;
  const stockStatus = stringParam(searchParams.get('stock_status')) as ProductsParams['stock_status'] | undefined;

  const params: ProductsParams = {
    page: numberParam(searchParams.get('page'), 1, 1, 500),
    per_page: numberParam(searchParams.get('per_page'), 20, 1, 50),
    status: 'publish',
    search: stringParam(searchParams.get('search')),
    category: stringParam(searchParams.get('category')),
    tag: stringParam(searchParams.get('tag')),
    include: stringParam(searchParams.get('include')),
    min_price: stringParam(searchParams.get('min_price')),
    max_price: stringParam(searchParams.get('max_price')),
    on_sale: booleanParam(searchParams.get('on_sale')),
    featured: booleanParam(searchParams.get('featured')),
  };

  if (orderby && PRODUCT_ORDERBYS.includes(orderby)) params.orderby = orderby;
  if (order && PRODUCT_ORDERS.includes(order)) params.order = order;
  if (stockStatus && STOCK_STATUSES.includes(stockStatus)) params.stock_status = stockStatus;

  const { products, total, totalPages } = await getProducts(params);

  return NextResponse.json(
    {
      products: products.map(sanitizeMobileProduct),
      total,
      totalPages,
    },
    {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    },
  );
}
