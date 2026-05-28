import { getProducts } from '@/lib/woocommerce';
import { SITE_URL } from '@/lib/siteUrl';

export const revalidate = 1800;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function savingsPercent(regular: string, sale: string): string {
  const r = parseFloat(regular);
  const s = parseFloat(sale);
  if (!r || !s || s >= r) return '';
  return ` — ${Math.round(((r - s) / r) * 100)}% off`;
}

export async function GET() {
  const { products } = await getProducts({
    on_sale: true,
    orderby: 'date',
    order: 'desc',
    per_page: 30,
    status: 'publish',
  });

  const items = products
    .map((p) => {
      const url = `${SITE_URL}/shop/${p.slug}`;
      const sale = p.sale_price || p.price;
      const regular = p.regular_price;
      const savings = savingsPercent(regular, sale);
      const image = p.images?.[0]?.src || '';
      const desc = escapeXml(
        `Now ৳${sale}${regular && regular !== sale ? ` (was ৳${regular}${savings})` : ''}. ` +
          (p.short_description
            ? p.short_description.replace(/<[^>]*>/g, '').trim().slice(0, 200)
            : `Buy ${p.name} in Bangladesh from Emart. Authentic, COD available.`)
      );
      const pubDate = p.date_modified
        ? new Date(p.date_modified).toUTCString()
        : new Date().toUTCString();

      return `
    <item>
      <title>${escapeXml(p.name)}${savings ? escapeXml(savings) : ''}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />` : ''}
    </item>`.trim();
    })
    .join('\n    ');

  const feedUrl = `${SITE_URL}/deals.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Emart Skincare Bangladesh — Deals &amp; Discounts</title>
    <link>${SITE_URL}/shop</link>
    <description>Current skincare deals and discounts at Emart Bangladesh. Authentic K-beauty and global brands, COD available.</description>
    <language>en-BD</language>
    <copyright>© ${new Date().getFullYear()} Emart Skincare Bangladesh</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/images/emart-logo.png</url>
      <title>Emart Deals</title>
      <link>${SITE_URL}/shop</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
