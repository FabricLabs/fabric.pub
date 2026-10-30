'use strict';

const fs = require('fs');
const path = require('path');

const HomePage = require('../components/HomePage');

async function main (input = {}) {
  const page = new HomePage(input);
  const target = path.resolve(__dirname, '..', 'assets', 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, page.toHTML());
  return { target };
}

main().catch((exception) => {
  console.error('[BUILD:SITE]', '[EXCEPTION]', exception);
  process.exitCode = 1;
}).then((output) => {
  if (output) console.log('[BUILD:SITE]', '[OUTPUT]', output);
});
