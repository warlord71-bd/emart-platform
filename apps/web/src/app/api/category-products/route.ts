import { NextRequest, NextResponse } from 'next/server';
import { wooClient } from '@/lib/woocommerce';

// Cache slug → ID in memory (lives for the process lifetime)
const slugCache: Record<string, number> = {};

async function getCategoryId(slug: string): Promise<number | null> {
  if (slugCache[slug]) return slugCache[slug];
  try {
    const res = await wooClient.get('/products/categories', {
      params: { slug, per_page: 1 },
    });
    const cat = res.data?.[0];
    if (cat?.id) {
      slugCache[slug] = cat.id;
      return cat.id;
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug  = searchParams.get('slug') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    const categoryId = await getCategoryId(slug);
    if (!categoryId) {
      return NextResponse.json([]);
    }
    const res = await wooClient.get('/products', {
      params: { category: categoryId, per_page: limit, status: 'publish' },
    });
    return NextResponse.json(res.data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
