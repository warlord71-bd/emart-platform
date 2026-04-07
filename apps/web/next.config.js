/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/category/face-care', destination: '/category/face-cleansers', permanent: false },
      { source: '/category/serum-toner', destination: '/category/serums-ampoules-essences', permanent: false },
      { source: '/category/body-care', destination: '/shop', permanent: false },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '5.189.188.229',
      },
      {
        protocol: 'https',
        hostname: 'e-mart.com.bd',
      },
      {
        protocol: 'https',
        hostname: '**.e-mart.com.bd',
      },
      {
        protocol: 'https',
        hostname: '**.woocommerce.com',
      },
    ],
  },
};

module.exports = nextConfig;
