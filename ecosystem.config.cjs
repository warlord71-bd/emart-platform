// PM2 ecosystem config — env-isolated process definitions.
// Restart procedure: pm2 delete <name> && pm2 start ecosystem.config.cjs --only <name>
// Full reset:        pm2 delete all && pm2 start ecosystem.config.cjs && pm2 save
//
// WHY this exists: PM2 inherits the launching shell's full env (CF_API_TOKEN, VSCODE_CLI_REQUIRE_TOKEN, etc.)
// into every child process. Restarting from this config gives each process only its declared env vars.

const NVM_NODE = '/root/.nvm/versions/node/v22.22.2/bin/node';
const NVM_NPM = '/root/.nvm/versions/node/v22.22.2/bin/npm';
const CLEAN_PATH = '/root/.nvm/versions/node/v22.22.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';

module.exports = {
  apps: [
    // ── Always-on services ─────────────────────────────────────────────
    {
      name: 'emartweb',
      script: NVM_NPM,
      args: 'start -- -H 127.0.0.1 -p 3000',
      cwd: '/var/www/emart-platform/apps/web',
      interpreter: NVM_NODE,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'emart-presence',
      script: 'server.js',
      cwd: '/var/www/emart-platform/apps/presence-server',
      interpreter: 'node',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'emart-embed',
      script: '/usr/bin/bash',
      args: '-c "uvicorn embed_service:app --host 127.0.0.1 --port 8077"',
      cwd: '/root/emart-platform/services/embed',
      interpreter: 'none',
      autorestart: true,
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
        VIRTUAL_ENV: '',
      },
    },
    {
      name: 'emart-reels-bot',
      script: 'reels_bot.py',
      cwd: '/root/emart-platform/workspace/content-orchestrator/video-engine',
      interpreter: 'python3',
      autorestart: true,
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    // ── Other sites (non-Emart, same VPS) ──────────────────────────────
    // n8n is Medimart's — managed outside this config
    {
      name: 'kbazar24web',
      script: NVM_NPM,
      args: 'start',
      cwd: '/var/www/kbazar24-platform/apps/web',
      interpreter: NVM_NODE,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'medimartweb',
      script: NVM_NPM,
      args: 'start -- -p 3002',
      cwd: '/var/www/medimart-web/web',
      interpreter: NVM_NODE,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },

    // ── Cron / scheduled jobs (autorestart: false) ─────────────────────
    {
      name: 'emart-blog-generator',
      script: 'blog_generator_run.sh',
      cwd: '/var/www/emart-platform/workspace/content-orchestrator/scripts/active',
      interpreter: 'bash',
      autorestart: false,
      cron_restart: '0 2,10,18 * * *',
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'emart-checkout-monitor',
      script: 'checkout_monitor_run.sh',
      cwd: '/var/www/emart-platform/workspace/content-orchestrator/scripts/active',
      interpreter: 'bash',
      autorestart: false,
      cron_restart: '*/15 * * * *',
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'emart-competitor-prices',
      script: 'competitor_prices_run.sh',
      cwd: '/var/www/emart-platform/workspace/content-orchestrator/scripts/active',
      interpreter: 'bash',
      autorestart: false,
      cron_restart: '0 2 * * *',
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'emart-revenue-health',
      script: 'revenue_health_check.sh',
      cwd: '/var/www/emart-platform/workspace/content-orchestrator/scripts/active',
      interpreter: 'bash',
      autorestart: false,
      cron_restart: '*/30 * * * *',
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'emart-seo-autoscan',
      script: 'seo_auto_scan.sh',
      cwd: '/var/www/emart-platform/workspace/content-orchestrator/scripts/active',
      interpreter: 'bash',
      autorestart: false,
      cron_restart: '0 0 * * *',
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
    {
      name: 'emart-meta-gen',
      script: 'meta_gen_batch.sh',
      cwd: '/var/www/emart-platform/workspace/content-orchestrator/scripts/active',
      interpreter: 'bash',
      autorestart: true,
      env: {
        PATH: CLEAN_PATH,
        HOME: '/root',
      },
    },
  ],
};
