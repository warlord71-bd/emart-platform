import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/?add_to_cart=',
          '/?add-to-cart=',
          '/?add_to_wishlist=',
          '/?remove_from_cart=',
          '/cart/',
          '/checkout/',
          '/account/',
          '/api/',
          '/wp-admin/',
          '/wp-login.php',
          '/wp-json/',
          '/graphql',
          '/xmlrpc.php',
        ],
      },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'cohere-ai', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: [
      'https://e-mart.com.bd/sitemap.xml',
      'https://e-mart.com.bd/sitemap_index.xml',
    ],
  }
}
