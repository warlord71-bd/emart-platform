/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/category/face-care', destination: '/category/face-cleansers', permanent: false },
      { source: '/category/serum-toner', destination: '/category/serums-ampoules-essences', permanent: false },
      { source: '/category/body-care', destination: '/shop', permanent: false },
      { source: '/shop/:slug', destination: '/:slug', permanent: false },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'e-mart.com.bd',
      },
      {
        protocol: 'https',
        hostname: '**.woocommerce.com',
      },
    ],
  },
};

module.exports = nextConfig;
