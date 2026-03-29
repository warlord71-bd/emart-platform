/** @type {import('next').NextConfig} */
const nextConfig = {
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
