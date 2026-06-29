#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.resolve(__dirname, '../../../..', 'apps/web');

function localRequire(name) {
  return require(path.join(WEB_ROOT, 'node_modules', name));
}

const dotenv = localRequire('dotenv');
const ENV_PATHS = [
  path.join(WEB_ROOT, '.env.local'),
  '/var/www/emart-platform/apps/web/.env.local',
];

const envPath = ENV_PATHS.find((candidate) => fs.existsSync(candidate));
if (envPath) dotenv.config({ path: envPath });

module.exports = {
  axios: localRequire('axios'),
  envPath,
  WEB_ROOT,
};
