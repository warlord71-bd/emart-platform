/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // ── Woodmart legacy paths ──────────────────────────────────────────────
      // /product-category/skin-care/ → /category/skin-care/  (catches all sub-paths)
      { source: '/product-category/:slug*', destination: '/category/:slug*', permanent: true },
      // /product/xyz → /shop/xyz  (also handled at nginx level for speed)
      { source: '/product/:slug', destination: '/shop/:slug', permanent: true },
      // /product-tag/retinol → /shop  (tags have no dedicated page; land on shop)
      { source: '/product-tag/:slug*', destination: '/shop', permanent: true },
      // WooCommerce account area
      { source: '/my-account', destination: '/account', permanent: true },
      { source: '/my-account/', destination: '/account', permanent: true },
      { source: '/my-account/:path*', destination: '/account', permanent: true },
      // WooCommerce cart/checkout legacy
      { source: '/cart', destination: '/', permanent: false },
      { source: '/checkout', destination: '/', permanent: false },

      // ── Known slug fixes ───────────────────────────────────────────────────
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/contact-us/', destination: '/contact', permanent: true },
      { source: '/order-tracking', destination: '/track-order', permanent: true },
      { source: '/order-tracking/', destination: '/track-order', permanent: true },
      { source: '/homepage', destination: '/', permanent: true },
      { source: '/homepage/', destination: '/', permanent: true },
      { source: '/shop/%e0%a6%a6%e0%a6%be%e0%a6%97-%e0%a6%aa%e0%a6%bf%e0%a6%97%e0%a6%ae%e0%a7%87%e0%a6%a8%e0%a7%8d%e0%a6%9f%e0%a7%87%e0%a6%b6%e0%a6%a8-%e0%a6%93-%e0%a6%a1%e0%a6%be%e0%a6%b0%e0%a7%8d%e0%a6%95-%e0%a6%b8', destination: '/shop/beaute-glutathione-skin1004-centella-brightening-combo-2pcs', permanent: true },
      { source: '/category/night-crime', destination: '/category/night-cream', permanent: true },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'e-mart.com.bd' },
      { protocol: 'https', hostname: '**.woocommerce.com' },
    ],
  },
};
module.exports = nextConfig;
