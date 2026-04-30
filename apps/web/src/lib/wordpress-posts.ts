const WORDPRESS_ORIGIN = process.env.WOO_INTERNAL_URL || process.env.NEXT_PUBLIC_WOO_URL || 'https://e-mart.com.bd';
const PUBLIC_SITE_URL = 'https://e-mart.com.bd';

type RenderedValue = {
  rendered?: string;
};

type RankMathSeo = {
  title?: string | null;
  description?: string | null;
  focus_keyword?: string | null;
  canonical_url?: string | null;
};

type WordPressPostResponse = {
  id: number;
  slug: string;
  link?: string;
  date?: string;
  modified?: string;
  title?: RenderedValue;
  excerpt?: RenderedValue;
  content?: RenderedValue;
  rank_math_seo?: RankMathSeo;
};

export type BlogPostSummary = {
  id: number;
  slug: string;
  href: string;
  legacyHref: string;
  title: string;
  excerpt: string;
  date: string;
  modified: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type BlogPost = BlogPostSummary & {
  content: string;
};

function getWordPressUrl(path: string, params: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, WORDPRESS_ORIGIN);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

async function fetchWordPressPosts(params: Record<string, string | number | boolean | undefined>) {
  try {
    const url = getWordPressUrl('/wp-json/wp/v2/posts', params);
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data as WordPressPostResponse[] : [];
  } catch {
    return [];
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, decimal: string) => {
      const code = parseInt(decimal, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function textFromHtml(value?: string) {
  return decodeHtml(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\[&hellip;\]|&hellip;|\[\.\.\.\]/gi, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizePostHtml(value?: string) {
  return (value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .trim();
}

function normalizePublicUrl(value?: string) {
  if (!value) return PUBLIC_SITE_URL;

  try {
    const url = new URL(value);
    return `${PUBLIC_SITE_URL}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}

function toBlogPost(post: WordPressPostResponse): BlogPost {
  const slug = post.slug || String(post.id);
  const title = textFromHtml(post.title?.rendered) || 'Beauty guide';
  const excerpt = textFromHtml(post.excerpt?.rendered).slice(0, 170);
  const rm = post.rank_math_seo;

  return {
    id: Number(post.id),
    slug,
    href: `/blog/${slug}`,
    legacyHref: normalizePublicUrl(post.link),
    title,
    excerpt,
    content: sanitizePostHtml(post.content?.rendered),
    date: post.date || new Date().toISOString(),
    modified: post.modified || post.date || new Date().toISOString(),
    seoTitle: rm?.title?.trim() || null,
    seoDescription: rm?.description?.trim() || null,
  };
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function getWordPressPosts({ perPage = 6 }: { perPage?: number } = {}): Promise<BlogPostSummary[]> {
  const posts = await fetchWordPressPosts({
    per_page: perPage,
    orderby: 'date',
    order: 'desc',
    _fields: 'id,slug,link,title,excerpt,date,modified,rank_math_seo',
  });

  return posts.map(toBlogPost);
}

export async function getWordPressPostBySlug(slug: string): Promise<BlogPost | null> {
  const decodedSlug = safeDecodeURIComponent(slug);
  const encodedSlug = encodeURIComponent(decodedSlug).toLowerCase();
  const candidates = Array.from(new Set([slug, decodedSlug, encodedSlug])).filter(Boolean);

  for (const candidate of candidates) {
    const posts = await fetchWordPressPosts({
      slug: candidate,
      per_page: 1,
      _fields: 'id,slug,link,title,excerpt,content,date,modified,rank_math_seo',
    });

    if (posts[0]) return toBlogPost(posts[0]);
  }

  return null;
}
