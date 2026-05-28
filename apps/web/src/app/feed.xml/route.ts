import { getWordPressPosts } from '@/lib/wordpress-posts';
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

function toRfc822(dateStr: string): string {
  try {
    return new Date(dateStr).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export async function GET() {
  const posts = await getWordPressPosts({ perPage: 20 });

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${post.href}`;
      const desc = escapeXml(post.excerpt || post.seoDescription || '');
      return `
    <item>
      <title>${escapeXml(post.seoTitle || post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${desc}</description>
      ${post.imageUrl ? `<enclosure url="${escapeXml(post.imageUrl)}" type="image/jpeg" length="0" />` : ''}
    </item>`.trim();
    })
    .join('\n    ');

  const feedUrl = `${SITE_URL}/feed.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Emart Skincare Bangladesh — Blog</title>
    <link>${SITE_URL}</link>
    <description>Skincare tips, K-beauty guides, and product education from Emart Bangladesh.</description>
    <language>en-BD</language>
    <copyright>© ${new Date().getFullYear()} Emart Skincare Bangladesh</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/images/emart-logo.png</url>
      <title>Emart Skincare Bangladesh</title>
      <link>${SITE_URL}</link>
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
