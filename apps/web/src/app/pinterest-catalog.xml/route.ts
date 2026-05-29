import { getProducts } from '@/lib/woocommerce';
import { getProductBrandName } from '@/lib/product-utils';
import { SITE_URL } from '@/lib/siteUrl';
import { COMPANY } from '@/lib/companyProfile';

export const revalidate = 3600;

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  // Fetch up to 500 published products across pages
  const perPage = 100;
  let allProducts: Awaited<ReturnType<typeof getProducts>>['products'] = [];

  for (let page = 1; page <= 5; page++) {
    const { products } = await getProducts({
      status: 'publish',
      per_page: perPage,
      page,
      orderby: 'date',
      order: 'desc',
    });
    allProducts = allProducts.concat(products);
    if (products.length < perPage) break;
  }

  const items = allProducts
    .filter((p) => p.images?.[0]?.src && p.price)
    .map((p) => {
      const url = esc(`${SITE_URL}/shop/${p.slug}`);
      const image = esc(p.images[0].src);
      const price = parseFloat(p.price || '0');
      const regularPrice = parseFloat(p.regular_price || p.price || '0');
      const salePrice = p.sale_price ? parseFloat(p.sale_price) : null;
      const availability = p.stock_status === 'instock' ? 'in stock' : 'out of stock';
      const brand = esc(getProductBrandName(p) || COMPANY.brandName);
      const title = esc(p.name);
      const rawDesc = p.short_description || p.description || p.name;
      const desc = esc(stripHtml(rawDesc).slice(0, 500));

      return `
  <item>
    <g:id>${p.id}</g:id>
    <g:title>${title}</g:title>
    <g:description>${desc}</g:description>
    <g:link>${url}</g:link>
    <g:image_link>${image}</g:image_link>
    <g:price>${regularPrice.toFixed(2)} BDT</g:price>
    ${salePrice && salePrice < regularPrice ? `<g:sale_price>${salePrice.toFixed(2)} BDT</g:sale_price>` : ''}
    <g:availability>${availability}</g:availability>
    <g:condition>new</g:condition>
    <g:brand>${brand}</g:brand>
  </item>`.trim();
    })
    .join('\n  ');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(COMPANY.storeName)}</title>
    <link>${SITE_URL}</link>
    <description>Authentic Korean &amp; global skincare products. COD available across Bangladesh.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
