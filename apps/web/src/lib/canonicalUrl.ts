const STRIP_PARAMS = new Set([
  // pagination & ordering
  'orderby', 'order', 'page', 'per_page', 'paged',
  // analytics / ads / social tracking
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'yclid',
  'mc_cid', 'mc_eid',
  // WP/WC internals
  '_wpnonce', 'add-to-cart', 's', 'post_type', 'session_id',
  // WC attribute filters
  'filter_color', 'filter_size', 'min_price', 'max_price',
  // Emart shop UI filters — sorted/filtered views are not canonical pages
  'sort', 'category', 'brand', 'origin', 'in_stock', 'price',
]);

/**
 * Returns a clean canonical path by stripping WooCommerce/Next.js pagination
 * and sort query params that should not be indexed as separate pages.
 * Pass the result as `alternates.canonical` in generateMetadata.
 */
export function canonicalPath(
  pathname: string,
  searchParams?: URLSearchParams | Record<string, string | string[]>,
): string {
  if (!searchParams) return pathname;

  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(
          Object.entries(searchParams).flatMap(([k, v]) =>
            Array.isArray(v) ? v.map((val) => [k, val]) : [[k, v]],
          ),
        );

  const clean = new URLSearchParams();
  params.forEach((value, key) => {
    if (!STRIP_PARAMS.has(key)) clean.set(key, value);
  });

  const qs = clean.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
