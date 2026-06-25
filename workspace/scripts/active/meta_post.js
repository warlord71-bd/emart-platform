#!/usr/bin/env node
// Compatibility wrapper. The only publishing implementation is meta_publish.js.
const { cli } = require('./meta_publish');

const positional = process.argv.slice(2).filter((value) => !value.startsWith('--'));
if (positional.length >= 2 && !process.argv.includes('--caption') && !process.argv.includes('--image-url')) {
  process.argv.push('--caption', positional[0], '--image-url', positional[1]);
}

cli().catch((error) => { console.error(error.message); process.exit(1); });
