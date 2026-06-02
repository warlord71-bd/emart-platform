module.exports = {
  apps: [{
    name: 'emartweb',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/emart-platform/apps/web',
    exec_mode: 'fork',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=1536',
    },
    error_file: '/root/.pm2/logs/emartweb-error.log',
    out_file: '/root/.pm2/logs/emartweb-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
