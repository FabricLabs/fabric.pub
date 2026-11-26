'use strict';

const fs = require('fs');
const path = require('path');

const { siteDocuments } = require('../components/site');

function write (file, html) {
  const target = path.resolve(__dirname, '..', file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, html);
  fs.renameSync(temporary, target);
  return target;
}

function main () {
  const written = siteDocuments().map((document) => write(document.file, document.html));
  return { written };
}

try {
  const output = main();
  console.log('[BUILD:SITE]', '[OUTPUT]', output);
} catch (exception) {
  console.error('[BUILD:SITE]', '[EXCEPTION]', exception);
  process.exitCode = 1;
}
