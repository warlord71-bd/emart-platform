import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/woocommerce';
import { sanitizeMobileCategory } from '@/lib/mobileApi';

export const runtime = 'nodejs';
export const revalidate = 300;

function numberParam(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function booleanParam(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === 'true' || value === '1';
}

// Matches HOME_TOP_CATEGORY_ORDER from lib/category-navigation.ts — same order as web frontend
const MOBILE_CATEGORY_ORDER = [
  { slug: 'korean-beauty',          name: 'K-Beauty' },
  { slug: 'japanese-beauty',        name: 'J-Beauty' },
  { slug: 'serums-ampoules-essences', name: 'Serum & Ampoule' },
  { slug: 'moisturizer',            name: 'Moisturizers', candidates: ['night-cream', 'moisturizer', 'cream-moisturizers'] },
  { slug: 'emart-combos',           name: 'Kits & Combos' },
  { slug: 'sunscreen',              name: 'Sunscreen' },
  { slug: 'face-cleansers',         name: 'Cleansers' },
  { slug: 'makeup-cosmetics',       name: 'Makeup' },
  { slug: 'hair-personal-care',     name: 'Hair Care' },
  { slug: 'health-wellbeing',       name: 'Health' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const allCategories = await getCategories({ per_page: 100, hide_empty: true });
  const bySlug = new Map(allCategories.map(c => [c.slug, c]));

  // If requesting parent categories for home screen, return curated ordered list
  const isHomeRequest = searchParams.get('parent') === '0';
  if (isHomeRequest) {
    const result = [];
    for (const item of MOBILE_CATEGORY_ORDER) {
      const slugs = item.candidates ?? [item.slug];
      const cat = slugs.map(s => bySlug.get(s)).find(Boolean);
      if (cat) result.push(sanitizeMobileCategory({ ...cat, name: item.name }));
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' },
    });
  }

  // All other category requests (subcategories etc.) pass through normally
  const parent = searchParams.has('parent')
    ? numberParam(searchParams.get('parent'), 0, 0, 100000)
    : undefined;

  const categories = await getCategories({
    per_page: numberParam(searchParams.get('per_page'), 100, 1, 100),
    parent,
    hide_empty: booleanParam(searchParams.get('hide_empty'), true),
  });

  return NextResponse.json(categories.map(sanitizeMobileCategory), {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' },
  });
}
