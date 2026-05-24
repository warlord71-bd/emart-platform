import { NextResponse } from 'next/server';
import { getOfferCollectionProducts } from '@/lib/offerCollections';
import type { OfferCollectionSlug } from '@/lib/offerCollectionConfig';

const VALID_SLUGS = new Set<OfferCollectionSlug>([
  'bogo',
  'eid-offer',
  'clearance-sale',
  'combo',
  'free-delivery',
  'coupon',
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') as OfferCollectionSlug | null;

  if (!slug || !VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const products = await getOfferCollectionProducts(slug, 24);
    return NextResponse.json(
      { products },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
