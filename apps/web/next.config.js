/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
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
