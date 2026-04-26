import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { slug?: string; type?: 'product' | 'category' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const { slug, type } = body;
  if (!slug || !type) {
    return NextResponse.json({ ok: false, error: 'slug and type required' }, { status: 400 });
  }

  const revalidated: string[] = [];
  if (type === 'product') {
    revalidatePath(`/shop/${slug}`);
    revalidatePath(`/${slug}`);
    revalidatePath('/shop');
    revalidated.push(`/shop/${slug}`, `/${slug}`, '/shop');
  } else if (type === 'category') {
    revalidatePath(`/category/${slug}`);
    revalidatePath('/shop');
    revalidated.push(`/category/${slug}`, '/shop');
  } else {
    return NextResponse.json({ ok: false, error: 'unknown type' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, revalidated, at: new Date().toISOString() });
}
