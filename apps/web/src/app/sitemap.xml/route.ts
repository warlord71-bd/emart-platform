import { unstable_cache } from 'next/cache';
import { getSitemapEntries, type SitemapEntry } from '@/lib/sitemapEntries';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const getCachedSitemapXml = unstable_cache(createSitemapXml, ['emart-styled-sitemap-xml-v2'], {
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
  const entries = dedupeEntriesForXml(await getSitemapEntries());

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(renderUrlEntry),
    '</urlset>',
  ].join('\n');
}

function dedupeEntriesForXml(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = getSitemapUrlKey(entry.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function getSitemapUrlKey(value: string): string {
  try {
    const url = new URL(value);
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
    const searchParams = new URLSearchParams(url.search);
    searchParams.sort();

    return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  } catch {
    return value.trim().replace(/\/+$/, '');
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
