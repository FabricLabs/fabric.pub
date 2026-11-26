'use strict';

const FabricComponent = require('@fabric/http/types/component');
const { renderArticle, renderDocument } = require('./document');

/**
 * Copy for the fabric.pub home page. Fields marked trusted HTML are written
 * as-is. Links, code samples, and plain labels are escaped.
 */
const DEFAULTS = {
  title: 'Fabric',
  url: 'https://fabric.pub/',
  path: '/',
  description: 'Fabric is a protocol and reference client for peer-to-peer agreements, with Bitcoin as the settlement and bonding layer.',
  image: 'https://fabric.pub/favicon.svg',
  stylesheets: ['/site.css'],
  heading: 'Fabric',
  subtitle: 'Peer-to-peer agreements, settled in Bitcoin.',
  sections: [
    [
      { h2: 'Coordinate directly' },
      { p: 'Fabric lets people coordinate and pay each other directly, with Bitcoin as the settlement layer and no company in the middle.' },
      { p: 'It is a protocol and reference client for those agreements. <code>@fabric/core</code>, <code>@fabric/http</code>, and Fabric Hub are the stack you build on.' },
      { limit: '<code>@fabric/core</code> v0.1.0 is a release candidate.' }
    ],
    [
      { h2: 'Read the protocol' },
      { p: 'Ten walkthroughs follow one path, from how peers talk to where HTTP and the Hub sit. Each one names an offline script in the matching repository.' },
      { p: 'The scripts generate keys in memory, check a few facts, and exit. They do not listen, and they do not start Bitcoin or Lightning.' },
      { p: '<a href="/learn/">Read the walkthroughs</a>' }
    ],
    [
      { h2: 'Run Fabric Hub' },
      { p: 'Fabric Hub desktop installs on macOS, Windows, and Linux. On Mac it needs macOS 13 or later. Setup downloads and manages Bitcoin Core and Core Lightning for you. On Windows, the app manages Bitcoin Core only; Lightning isn\'t included.' },
      { p: 'Sign in to Fabric sites with your own key. Passport checks that the request comes from the site your browser actually shows. Pair Passport with a Hub, or with another signer, by comparing a six-digit code.' },
      { p: 'A public Hub is at <a href="https://hub.fabric.pub">hub.fabric.pub</a>.' }
    ],
    [
      { h2: 'In use' },
      {
        list: [
          '<a href="https://goon.vc">GoonCitizen</a> relays Star Citizen gameplay from your game log to a live dashboard, and only reads the log. Its groups share Bitcoin wallets that need several members to sign.',
          'Sensemaker is a self-hosted suite for gathering and analyzing information toward goals you set.',
          'Doorman is a community bot for Discord, Slack, and Matrix that welcomes new members and runs onboarding, extended with plugins.',
          'Soundtrack is a self-hosted app for listening to music together.'
        ]
      }
    ],
    [
      { h2: 'Source' },
      {
        links: [
          { href: 'https://github.com/FabricLabs/fabric', label: '@fabric/core' },
          { href: 'https://github.com/FabricLabs/fabric-http', label: '@fabric/http' },
          { href: 'https://github.com/FabricLabs/hub.fabric.pub', label: 'Fabric Hub' },
          { href: '/learn/', label: 'Walkthroughs' }
        ]
      }
    ]
  ]
};

/**
 * The fabric.pub home page as a Fabric HTTP component.
 */
class HomePage extends FabricComponent {
  /**
   * @param {Object} [settings] Overrides for any field in the page copy.
   */
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      handle: 'fabric-pub-home',
      path: '/'
    }, JSON.parse(JSON.stringify(DEFAULTS)), settings);

    this._state = {
      content: {
        title: this.settings.title,
        url: this.settings.url,
        path: this.settings.path,
        description: this.settings.description,
        image: this.settings.image,
        stylesheets: this.settings.stylesheets,
        heading: this.settings.heading,
        subtitle: this.settings.subtitle,
        sections: this.settings.sections
      }
    };

    return this;
  }

  /**
   * Render the page body.
   * @param {Object} [state] Page state; missing fields fall back to the component's.
   * @returns {String} The `<article>` element.
   */
  _getInnerHTML (state) {
    const page = Object.assign({}, this.state, state || {});
    return renderArticle(page);
  }

  /**
   * Render the full HTML document for `assets/index.html`.
   * @param {Object} [state] Page state; missing fields fall back to the component's.
   * @returns {String} HTML document.
   */
  toHTML (state) {
    const page = Object.assign({}, this.state, state || {});
    return renderDocument(Object.assign({}, page, {
      article: this._getInnerHTML(page)
    }));
  }
}

HomePage.DEFAULTS = DEFAULTS;

module.exports = HomePage;
