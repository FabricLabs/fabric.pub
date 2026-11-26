'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { siteDocuments } = require('../components/site');
const { WALKS } = require('../components/learn');

const ROOT = path.join(__dirname, '..');

function localAsset (href) {
  const relative = href.replace(/^\//, '');
  if (relative === '' || relative.endsWith('/')) return path.join(ROOT, 'assets', relative, 'index.html');
  return path.join(ROOT, 'assets', relative);
}

describe('site', function () {
  const documents = siteDocuments();

  it('publishes the home page and one page per walkthrough', function () {
    const paths = documents.map((document) => document.path);
    assert.deepStrictEqual(paths, ['/', '/learn/'].concat(WALKS.map((page) => `/learn/${page.slug}.html`)));
    assert.strictEqual(WALKS.length, 10);
  });

  it('matches the files on disk and links only local pages that exist', function () {
    const known = new Set(documents.map((document) => document.path));
    for (const document of documents) {
      const file = path.join(ROOT, document.file);
      assert.strictEqual(fs.readFileSync(file, 'utf8'), document.html, document.file);
      const hrefs = document.html.match(/href="([^"]+)"/g).map((token) => token.slice(6, -1));
      for (const href of hrefs) {
        if (/^https?:/.test(href)) continue;
        if (href.startsWith('#')) {
          assert.ok(document.html.includes(`id="${href.slice(1)}"`), `${document.path} missing ${href}`);
          continue;
        }
        assert.ok(href.startsWith('/'), `${document.path} has a non-root link ${href}`);
        if (href.endsWith('.css') || href.endsWith('.svg')) {
          assert.ok(fs.existsSync(localAsset(href)), `${href} missing`);
          continue;
        }
        const normalized = href.endsWith('/') || href.endsWith('.html') ? href : null;
        assert.ok(normalized, `${href} is not a page`);
        assert.ok(known.has(normalized), `${document.path} links unknown page ${href}`);
      }
    }
  });

  it('does not mention Grove or claim a finished private release', function () {
    const html = documents.map((document) => document.html).join('\n');
    assert.ok(!/grove/i.test(html));
    assert.ok(!html.includes('chat.fabric.pub'));
    assert.ok(!html.includes('completely private'));
    assert.ok(!html.includes('fully private'));
    assert.ok(!/<script/i.test(html));
    assert.ok(html.includes('release candidate'));
  });
});
