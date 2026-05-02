import { unstable_cache } from 'next/cache';
import { getSitemapEntries, type SitemapEntry } from '@/lib/sitemapEntries';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const getCachedSitemapXml = unstable_cache(createSitemapXml, ['emart-styled-sitemap-xml-v1'], {
  revalidate: 3600,
});

export async function GET() {
  const xml = await getCachedSitemapXml();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600',
    },
  });
}

async function createSitemapXml(): Promise<string> {
  const entries = await getSitemapEntries();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(renderUrlEntry),
    '</urlset>',
  ].join('\n');
}

function renderUrlEntry(entry: SitemapEntry): string {
  const lines = [
    '<url>',
    `<loc>${escapeXml(entry.url)}</loc>`,
  ];

  const formattedLastmod = formatLastmod(entry.lastModified);
  if (formattedLastmod) {
    lines.push(`<lastmod>${formattedLastmod}</lastmod>`);
  }

  if (entry.changeFrequency) {
    lines.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
  }
  if (typeof entry.priority === 'number') {
    lines.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
  }

  lines.push('</url>');
  return lines.join('\n');
}

function formatLastmod(value?: Date | string): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
