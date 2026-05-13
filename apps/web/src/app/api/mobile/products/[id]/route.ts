import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/woocommerce';
import { sanitizeMobileProduct } from '@/lib/mobileApi';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const productId = Number(params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const product = await getProductById(productId);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(sanitizeMobileProduct(product), {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' },
  });
}
