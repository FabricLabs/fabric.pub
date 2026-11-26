'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const FabricComponent = require('@fabric/http/types/component');
const HomePage = require('../components/HomePage');
const { CSP } = require('../components/document');

const INDEX = path.join(__dirname, '../assets/index.html');

describe('HomePage', function () {
  it('is a Fabric HTTP component', function () {
    const page = new HomePage();
    assert.ok(page instanceof FabricComponent);
    assert.strictEqual(page.settings.handle, 'fabric-pub-home');
    assert.strictEqual(page.path, '/');
  });

  it('renders the published assets/index.html byte for byte', function () {
    const page = new HomePage();
    assert.strictEqual(page.toHTML(), fs.readFileSync(INDEX, 'utf8'));
  });

  it('links only files that exist under the assets/ web root', function () {
    const page = new HomePage();
    const site = new URL(page.settings.url);
    const image = new URL(page.settings.image);
    assert.strictEqual(image.origin, site.origin);
    for (const href of page.settings.stylesheets.concat(image.pathname, '/favicon.svg')) {
      assert.ok(href.startsWith('/') && !href.startsWith('/assets/'), `${href} must be relative to the web root`);
      const relative = href.replace(/^\//, '');
      assert.ok(fs.existsSync(path.join(__dirname, '../assets', relative)), `${href} is not in assets/`);
    }
  });

  it('allows no scripts, forms, or third-party resources', function () {
    const html = new HomePage().toHTML();
    assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}" />`));
    assert.ok(!/<script/i.test(html));
    assert.ok(!html.includes('Grove'));
    assert.ok(!html.includes('chat.fabric.pub'));
  });

  it('renders the article as its inner HTML', function () {
    const html = new HomePage()._getInnerHTML();
    assert.ok(html.startsWith('<article>'));
    assert.ok(html.endsWith('</article>'));
    assert.ok(html.includes('<h1>Fabric</h1>'));
    assert.ok(html.includes('Read the walkthroughs'));
  });

  it('wraps the article in its handle as an element', function () {
    const html = new HomePage().render();
    assert.ok(/^<fabric-pub-home integrity="sha256-[A-Za-z0-9+/=]+"><article>/.test(html));
    assert.ok(html.endsWith('</article></fabric-pub-home>'));
  });

  it('takes copy from settings and escapes plain fields', function () {
    const html = new HomePage({
      description: 'Peers & "friends" <welcome>',
      url: 'https://example.com/?a=1&b=2'
    }).toHTML();
    assert.ok(html.includes('<meta property="og:description" content="Peers &amp; &quot;friends&quot; &lt;welcome&gt;" />'));
    assert.ok(html.includes('<meta property="og:url" content="https://example.com/?a=1&amp;b=2" />'));
    assert.ok(html.includes('<meta name="description" content="Peers &amp; &quot;friends&quot; &lt;welcome&gt;" />'));
  });

  it('keeps its trusted title entities but cannot break out of og:title', function () {
    const html = new HomePage({ title: 'Fabric &bull; "beta" <b>' }).toHTML();
    assert.ok(html.includes('<meta property="og:title" content="Fabric &bull; &quot;beta&quot; <b>" />'));
  });

  it('does not share default copy between instances', function () {
    const first = new HomePage();
    first.settings.sections.push([{ p: 'only on the first page' }]);
    first.settings.stylesheets.push('/first.css');
    const html = new HomePage().toHTML();
    assert.ok(!html.includes('only on the first page'));
    assert.ok(!html.includes('/first.css'));
  });

  it('refuses unknown blocks', function () {
    const page = new HomePage({ sections: [[{ blink: 'nope' }]] });
    assert.throws(() => page.toHTML(), /Unknown block/);
  });
});
