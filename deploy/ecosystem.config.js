// PM2 process manager configuration for the Emart Next.js web app.
//
// USAGE
//   cd /var/www/emart-platform
//   pm2 start deploy/ecosystem.config.js
//   pm2 save          # persist across reboots
//   pm2 startup       # enable on boot (follow the printed command)
//
// DEPLOY WORKFLOW (zero-downtime)
//   git pull origin main
//   cd apps/web && npm ci && npm run build && cd -
//   pm2 reload emart-web   # graceful reload — no dropped connections

module.exports = {
  apps: [
    {
      name: 'emart-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/emart-platform/apps/web',

      // Keep the process alive — restart on crash immediately,
      // then use exponential back-off (1 s → 16 s) to avoid tight crash loops.
      autorestart: true,
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,   // PM2 doubles this each restart
      max_restarts: 20,

      // Memory guard: restart if the process exceeds 512 MB.
      max_memory_restart: '512M',

      // Port the Next.js server listens on (must match nginx upstream).
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Cluster mode uses all CPU cores and enables pm2 reload (zero-downtime).
      // Set to 1 if your server has only 1 vCPU to avoid overhead.
      instances: 'max',
      exec_mode: 'cluster',

      // Structured JSON logs — easier to parse with tools like pm2-logrotate.
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/emart/web-error.log',
      out_file:   '/var/log/emart/web-out.log',
      merge_logs: true,
    },
  ],
};
