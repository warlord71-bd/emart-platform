/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://*.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://e-mart.com.bd https://*.e-mart.com.bd https://*.woocommerce.com https://www.facebook.com https://www.google-analytics.com https://www.googletagmanager.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://e-mart.com.bd https://www.google-analytics.com https://*.facebook.com https://www.googletagmanager.com",
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
