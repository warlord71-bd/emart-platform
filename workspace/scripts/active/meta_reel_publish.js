#!/usr/bin/env node
// Compatibility wrapper. The only publishing implementation is meta_publish.js.
const { cli } = require('./meta_publish');

cli().catch((error) => { console.error(error.message); process.exit(1); });
