import { getCategories } from '@/lib/woocommerce';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await getCategories({ per_page: 20, hide_empty: true });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}
