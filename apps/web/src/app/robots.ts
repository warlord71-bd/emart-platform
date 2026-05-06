import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Merchant Center/GSC product checks need unrestricted Google product
      // landing-page and image crawling. Specific groups prevent Googlebot
      // from inheriting generic query/path cleanup disallows below.
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Googlebot-image', allow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/?add_to_cart=',
          '/?add-to-cart=',
          '/?add_to_wishlist=',
          '/?remove_from_cart=',
          '/?s=',
          '/?feed=',
          '/*?srsltid=',
          '/*?orderby=',
          '/*?order=',
          '/*?paged=',
          '/*?per_page=',
          '/*?shop_view=',
          '/cart/',
          '/checkout/',
          '/account/',
          '/api/',
          '/feed/',
          '/author/',
          '/tag/',
          '/my-account/',
          '/wp-admin/',
          '/wp-login.php',
          '/wp-json/',
          '/wp-sitemap.xml',
          '/sitemap_index.xml',
          '/graphql',
          '/xmlrpc.php',
        ],
      },
      // AI search crawlers — allowed for product/brand discovery in AI search surfaces
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot', allow: '/' },
      // Bulk scrapers — not search engines, no SEO benefit
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'cohere-ai', disallow: '/' },
    ],
    sitemap: ['https://e-mart.com.bd/sitemap.xml'],
  }
}
