import { getWordPressPosts } from '@/lib/wordpress-posts';
import { SITE_URL } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic'; // News content is time-sensitive — always fetch fresh

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  // Google News sitemap: last 2 days of posts (Google News only indexes recent content)
  const posts = await getWordPressPosts({ perPage: 50 });

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const recentPosts = posts.filter((post) => {
    try {
      return new Date(post.date) >= twoDaysAgo;
    } catch {
      return false;
    }
  });

  // If no posts in last 2 days, include last 5 posts regardless (avoid empty sitemap)
  const items = recentPosts.length > 0 ? recentPosts : posts.slice(0, 5);

  const urlset = items
    .map((post) => {
      const url = `${SITE_URL}${post.href}`;
      const pubDate = new Date(post.date).toISOString();
      return `  <url>
    <loc>${escapeXml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>Emart Skincare Bangladesh</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlset}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
