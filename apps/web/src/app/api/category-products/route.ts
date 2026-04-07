import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/woocommerce';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '';
  const limit = parseInt(searchParams.get('limit') || '6', 10);

  try {
    const { products } = await getProducts({ category: slug, per_page: limit });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
