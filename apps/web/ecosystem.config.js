// PM2 Ecosystem Config for E-Mart BD
// Run: pm2 start ecosystem.config.js --env production
// OR:  pm2 restart emartweb --update-env

module.exports = {
  apps: [
    {
      name: 'emartweb',
      cwd: '/root/emart-platform/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: '3000',
        NEXT_PUBLIC_WOO_URL: 'http://5.189.188.229',
        WOO_CONSUMER_KEY: 'ck_UpIuas9dEVJvyknu0l1Jmlh91XjGqQtdKPao6gqc',
        WOO_CONSUMER_SECRET: 'cs_lkyPdR3eQreJvsz4Vgo5Ive5zou7hKJE4zo59AS',
        NEXT_PUBLIC_SITE_URL: 'http://5.189.188.229:3000',
        NEXTAUTH_URL: 'http://5.189.188.229:3000',
        NEXTAUTH_SECRET: 'emart-midnight-blossom-secret-2025',
      },
    },
  ],
};
