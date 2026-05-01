import { getCategories } from '@/lib/woocommerce';
import { HOME_TOP_CATEGORY_ORDER, TOP_CATEGORY_IMAGE_OVERRIDES } from '@/lib/category-navigation';

export interface FeaturedCategory {
  id: string;
  slug: string;
  href?: string;
  name: string;
  product_count: number;
  hero_image: string | null;
  is_hot: boolean;
  has_new: boolean;
  has_sale: boolean;
}

// per_page:100 matches page.tsx so Next.js deduplicates the fetch in the same render pass
export async function getFeaturedCategories(limit = 5): Promise<FeaturedCategory[]> {
  const allCategories = await getCategories({ per_page: 100, hide_empty: true });
  const bySlug = new Map(allCategories.map((c) => [c.slug, c]));
  const result: FeaturedCategory[] = [];

  for (const item of HOME_TOP_CATEGORY_ORDER) {
    if (result.length >= limit) break;
    const resolvedSlug =
      item.slug ||
      item.slugCandidates?.find((s) => bySlug.has(s)) ||
      item.fallbackSlug;
    if (!resolvedSlug) continue;
    const cat = bySlug.get(resolvedSlug);
    if (!cat) continue;

    result.push({
      id: String(cat.id),
      slug: resolvedSlug,
      href: item.href || `/category/${resolvedSlug}`,
      name: item.name || cat.name,
      product_count: cat.count ?? 0,
      hero_image: TOP_CATEGORY_IMAGE_OVERRIDES[resolvedSlug] ?? cat.image?.src ?? null,
      is_hot: false,
      has_new: false,
      has_sale: false,
    });
  }

  return result;
}
