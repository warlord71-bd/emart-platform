/** @type {import('next').NextConfig} */
const privateNoStoreHeaders = [
  { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
  { key: 'CDN-Cache-Control', value: 'private, no-store' },
  { key: 'Cloudflare-CDN-Cache-Control', value: 'private, no-store' },
];

const nextConfig = {
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  trailingSlash: false,

  async headers() {
    return [
      {
        source: '/checkout',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/account',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/account/orders',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/order-success',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/track-order',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/wishlist',
        headers: privateNoStoreHeaders,
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',             value: 'DENY' },
          { key: 'X-Content-Type-Options',       value: 'nosniff' },
          { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',           value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',    value: 'max-age=15552000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://*.cloudflare.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://e-mart.com.bd https://*.e-mart.com.bd https://*.woocommerce.com https://www.facebook.com https://www.google-analytics.com https://www.googletagmanager.com https://img.youtube.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://e-mart.com.bd wss://e-mart.com.bd https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.google.com https://*.google.com https://*.doubleclick.net https://*.facebook.com https://www.googletagmanager.com https://cloudflareinsights.com",
              "frame-src 'self' https://www.facebook.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/product-category/:slug*', destination: '/category/:slug*', permanent: true },
      { source: '/product/:slug',           destination: '/shop/:slug',      permanent: true },
      { source: '/product-tag/:slug*',      destination: '/shop',            permanent: true },
      { source: '/tag/:slug*',              destination: '/shop',            permanent: true },
      { source: '/my-account',              destination: '/account',         permanent: true },
      { source: '/my-account/',             destination: '/account',         permanent: true },
      { source: '/my-account/:path*',       destination: '/account',         permanent: true },
      { source: '/cart',                    destination: '/checkout',        permanent: false },
      { source: '/contact-us',             destination: '/contact',          permanent: true },
      { source: '/contact-us/',            destination: '/contact',          permanent: true },
      { source: '/order-tracking',         destination: '/track-order',      permanent: true },
      { source: '/order-tracking/',        destination: '/track-order',      permanent: true },
      { source: '/homepage',               destination: '/',                 permanent: true },
      { source: '/homepage/',              destination: '/',                 permanent: true },
      { source: '/shop/%e0%a6%a6%e0%a6%be%e0%a6%97-%e0%a6%aa%e0%a6%bf%e0%a6%97%e0%a6%ae%e0%a7%87%e0%a6%a8%e0%a7%8d%e0%a6%9f%e0%a7%87%e0%a6%b6%e0%a6%a8-%e0%a6%93-%e0%a6%a1%e0%a6%be%e0%a6%b0%e0%a7%8d%e0%a6%95-%e0%a6%b8', destination: '/shop/beaute-glutathione-skin1004-centella-brightening-combo-2pcs', permanent: true },
      { source: '/category/night-crime',   destination: '/category/night-cream', permanent: true },
      { source: '/about-us',              destination: '/our-story',      permanent: true },
      { source: '/about-us/',             destination: '/our-story',      permanent: true },
      { source: '/about-us-2',            destination: '/our-story',      permanent: true },
      { source: '/about-us-2/',           destination: '/our-story',      permanent: true },
      { source: '/term-conditions',       destination: '/terms-conditions', permanent: true },
      { source: '/term-conditions/',      destination: '/terms-conditions', permanent: true },
      // WP pages found via wp post list — redirect to nearest Next.js equivalent
      { source: '/home2',                 destination: '/',                 permanent: true },
      { source: '/how-to-buy',            destination: '/faq',              permanent: true },
      { source: '/help-center',           destination: '/contact',          permanent: true },
      { source: '/shipping-delivery',     destination: '/shipping-policy',  permanent: true },
      { source: '/refund_returns',        destination: '/return-policy',    permanent: true },
      { source: '/my-orders',             destination: '/account/orders',   permanent: true },
      { source: '/dashboard',             destination: '/account',          permanent: true },
      { source: '/wishlist-2',            destination: '/wishlist',         permanent: true },
      { source: '/policy',               destination: '/return-policy',    permanent: true },
      // Duplicate product cleanup 2026-05-08 — remove slug → keep slug
      { source: '/shop/3w-clinic-collagen-luxury-gold-cream-100ml',                                              destination: '/shop/3w-clinic-collagen-and-luxury-gold-cream-100ml',                                            permanent: true },
      { source: '/shop/cerave-skin-renewing-retinol-serum-30-ml',                                                destination: '/shop/cerave-skin-renewing-retinol-serum-30ml-2',                                                  permanent: true },
      { source: '/shop/cerave-pm-facial-moisturizing-lotion-89-ml',                                              destination: '/shop/cerave-pm-facial-moisturizing-lotion-89ml',                                                  permanent: true },
      { source: '/shop/simple-daily-skin-detox-sos-clearing-booster-25ml',                                       destination: '/shop/simple-daily-skin-detox-sos-clearing-booster-25ml-2',                                        permanent: true },
      { source: '/shop/tiam-pore-minimizing-21-serum-40ml-3',                                                    destination: '/shop/tiam-pore-minimizing-21-serum-40ml',                                                         permanent: true },
      { source: '/shop/cos-de-baha-vitamin-c-15-serum-va-30ml',                                                  destination: '/shop/cos-de-baha-vitamin-c-15-serum-30ml',                                                       permanent: true },
      { source: '/shop/paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-30ml',                               destination: '/shop/paulas-choice-skin-perfecting-2-bha-liquid-exfoliant-30ml-2',                                permanent: true },
      { source: '/shop/the-inkey-list-salicylic-acid-cleanser-150-ml',                                           destination: '/shop/the-inkey-list-salicylic-acid-cleanser-150ml-2',                                             permanent: true },
      { source: '/shop/cleanclear-night-relaxing-deep-cleaning-face-wash-240ml',                                  destination: '/shop/clean-clear-night-relaxing-deep-cleaning-face-wash-240ml',                                   permanent: true },
      { source: '/shop/neutrogena-oil-free-acne-wash-269ml-2',                                                   destination: '/shop/neutrogena-oil-free-acne-wash-269ml',                                                        permanent: true },
      { source: '/shop/neutrogena-ultra-sheer-dry-touch-sunscreen-spf55',                                        destination: '/shop/neutrogena-ultra-sheer-dry-touch-sunscreen-spf-55-88ml',                                     permanent: true },
      { source: '/shop/neutrogena-hydro-boost-water-gel-50ml',                                                   destination: '/shop/neutrogena-hydro-boost-water-gel',                                                           permanent: true },
      { source: '/shop/cos-de-baha-snail-mucin-hyaluronic-acid-serum-sh-120ml-2',                                destination: '/shop/cos-de-baha-snail-mucin-hyaluronic-acid-serum-sh-120ml',                                     permanent: true },
      { source: '/shop/raip-r3-argan-hair-oil-100ml',                                                            destination: '/shop/raip-r3-argan-hair-oil-100-ml-original',                                                     permanent: true },
      { source: '/shop/beauty-of-joseon-matte-sun-stick-mugwortcamelia-18g',                                     destination: '/shop/beauty-of-joseon-matte-sun-stick-mugwortcamelia18g-0-63fl-oz',                               permanent: true },
      { source: '/shop/medipeel-melanon-x-dark-spot-blemish-care-solution-cream-30ml',                           destination: '/shop/medi-peel-melanon-x-cream-30ml',                                                             permanent: true },
      { source: '/shop/im-from-rice-sunscreen-50ml',                                                             destination: '/shop/im-from-rice-sunscreen',                                                                     permanent: true },
      // Mary&May: keep slug is stale (was renamed); redirect still resolves to correct product ID 58048
      { source: '/shop/maryampmay-white-collagen-cleansing-foam-150ml',                                          destination: '/shop/marymay-blackberry-complex-glow-washoff-pack-125g',                                          permanent: true },
      { source: '/shop/la-roche-posay-cicaplast-baume-b5-100ml-2',                                               destination: '/shop/la-roche-posay-cicaplast-baume-b5-100ml',                                                    permanent: true },
      { source: '/shop/la-roche-posay-cicaplast-baume-b5-40ml-2',                                                destination: '/shop/la-roche-posay-cicaplast-baume-b5-40ml',                                                     permanent: true },
      { source: '/shop/im-from-black-rice-toner-150ml',                                                          destination: '/shop/im-from-black-rice-toner-150ml-2',                                                          permanent: true },
      { source: '/shop/raip-moisture-repair-body-lotion-500-ml',                                                 destination: '/shop/raip-moisture-repair-body-lotion-original-500-ml',                                          permanent: true },
      { source: '/shop/3w-clinic-charcoal-cleansing-foam100ml',                                                  destination: '/shop/3w-clinic-charcoal-cleansing-foam-100-ml',                                                   permanent: true },
      { source: '/shop/oriox-color-lip-balm-4-8g-cherry-2',                                                     destination: '/shop/oriox-color-lip-balm-4-8g-cherry',                                                          permanent: true },
      { source: '/shop/daiso-glucosamine-supplement-15-days-30-tablet-2',                                        destination: '/shop/daiso-glucosamine-supplement-15-days-30-tablet',                                             permanent: true },
      { source: '/shop/everly-matte-me-up-lip-liner-pencil-dark-brown-1-5g-2',                                   destination: '/shop/everly-matte-me-up-lip-liner-pencil-dark-brown-1-5g',                                        permanent: true },
      { source: '/shop/kiss-beauty-bling-bling-liquid-highlighter-01-40ml',                                      destination: '/shop/kiss-beauty-bling-bling-liquid-highlighter-01-40ml-2',                                      permanent: true },
      { source: '/shop/l-a-girl-pro-matte-liquid-foundation-glm715porcelain-30ml',                               destination: '/shop/l-a-girl-pro-matte-liquid-foundation-glm715porcelain-30ml-2',                               permanent: true },
      { source: '/shop/lmltop-beauty-makeup-tools-2pcs-puff',                                                    destination: '/shop/lmltop-beauty-makeup-tools-2pcs-puff-2',                                                     permanent: true },
      { source: '/shop/maange-12pcs-mix-makeup-brush-set-white-2',                                               destination: '/shop/maange-12pcs-mix-makeup-brush-set-white',                                                    permanent: true },
      { source: '/shop/maybelline-super-stay-matte-ink-liquid-lipstick-117-ground-breaker-5ml-2',                destination: '/shop/maybelline-super-stay-matte-ink-liquid-lipstick-117-ground-breaker-5ml',                     permanent: true },
      { source: '/shop/pinkflash-lasting-matte-foundation-pf-f03-vanilla-01-25g-2',                              destination: '/shop/pinkflash-lasting-matte-foundation-pf-f03-vanilla-01-25g',                                  permanent: true },
      { source: '/shop/rohto-acnes-foaming-face-wash-160ml-2',                                                   destination: '/shop/rohto-acnes-foaming-face-wash-160ml',                                                        permanent: true },
    ];
  },

  images: {
    unoptimized: false,
    minimumCacheTTL: 2678400,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'e-mart.com.bd' },
      { protocol: 'https', hostname: 'www.e-mart.com.bd' },
      { protocol: 'https', hostname: '**.woocommerce.com' },
      { protocol: 'http',  hostname: '5.189.188.229' },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};
module.exports = nextConfig;
