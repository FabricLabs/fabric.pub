'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const FabricComponent = require('@fabric/http/types/component');
const HomePage = require('../components/HomePage');

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

  it('renders the article as its inner HTML', function () {
    const html = new HomePage()._getInnerHTML();
    assert.ok(html.startsWith('<article>'));
    assert.ok(html.endsWith('</article>'));
    assert.ok(html.includes('<h1>Welcome to <strong>Fabric</strong>, friend.</h1>'));
    assert.ok(html.includes('<!-- <section>\n        <h2>Serverless?</h2>'));
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
  });

  it('refuses unknown blocks', function () {
    const page = new HomePage({ sections: [[{ blink: 'nope' }]] });
    assert.throws(() => page.toHTML(), /Unknown block/);
  });
});
