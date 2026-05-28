import { getProducts } from '@/lib/woocommerce';
import { SITE_URL } from '@/lib/siteUrl';

export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { products } = await getProducts({
    orderby: 'date',
    order: 'desc',
    per_page: 30,
    status: 'publish',
  });

  const items = products
    .map((p) => {
      const url = `${SITE_URL}/shop/${p.slug}`;
      const price = p.sale_price || p.price || p.regular_price;
      const image = p.images?.[0]?.src || '';
      const desc = escapeXml(
        p.short_description
          ? p.short_description.replace(/<[^>]*>/g, '').trim()
          : `Buy ${p.name} in Bangladesh from Emart. 100% authentic, fast delivery, COD available.`
      );
      const pubDate = p.date_modified
        ? new Date(p.date_modified).toUTCString()
        : new Date().toUTCString();

      return `
    <item>
      <title>${escapeXml(p.name)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <price xmlns="urn:emart:price">৳${escapeXml(price)}</price>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />` : ''}
    </item>`.trim();
    })
    .join('\n    ');

  const feedUrl = `${SITE_URL}/new-arrivals.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Emart Skincare Bangladesh — New Arrivals</title>
    <link>${SITE_URL}/shop</link>
    <description>Freshly added K-beauty and global skincare products at Emart Bangladesh. Authentic, fast delivery, COD available.</description>
    <language>en-BD</language>
    <copyright>© ${new Date().getFullYear()} Emart Skincare Bangladesh</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/images/emart-logo.png</url>
      <title>Emart New Arrivals</title>
      <link>${SITE_URL}/shop</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
