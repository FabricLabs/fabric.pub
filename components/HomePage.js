'use strict';

const FabricComponent = require('@fabric/http/types/component');

/**
 * Copy for the fabric.pub home page. Fields marked "trusted HTML" are written
 * as-is (entities and inline markup allowed); everything else is escaped.
 */
const DEFAULTS = {
  // Trusted HTML; used for `<title>` and `og:title`.
  title: 'Fabric &bull; the decentralized operating system',
  url: 'https://fabric.pub/',
  description: 'Fabric Labs is building a new kind of OS — safe, secure, and completely private by default.  Now accepting applications for our Developer Support Program!',
  image: 'https://fabric.pub/assets/truth-is-stronger-than-illusions.jpg',
  stylesheets: ['/assets/tufte.css', '/assets/latex.css'],
  // Trusted HTML.
  heading: 'Welcome to <strong>Fabric</strong>, friend.',
  // Trusted HTML.
  subtitle: 'An <abbr title="3BZssGaw5HJEeZPhQDR3ExSqfSn1sFWb46">Operating System</abbr> for the world\'s most powerful supercomputer.',
  // Each section is a list of blocks: `{ h2 | h3 | p: <trusted HTML>, style? }`
  // or `{ links: [{ href, label }] }`.
  sections: [
    [
      { h2: 'Getting started is easy.  <a href="https://chat.fabric.pub/#/group/+labs:fabric.pub"><strong>Join the Community</strong> &raquo;</a>' },
      { p: 'We\'re finalizing the release of <a href="https://github.com/FabricLabs/fabric"><code>@fabric/core</code></a>, an initial set of <a href="https://dev.fabric.pub">developer-focused APIs</a> for interacting with Fabric.  For early access, <a href="https://chat.fabric.pub">join <strong>Grove</strong></a>, our community chat.' }
    ],
    [
      { h3: 'Learning to Code?' },
      { p: 'You\'re in the right place.  We offer mentorships in <a href="https://chat.fabric.pub/#/room/#mentorships:fabric.pub">the <code>#mentorships:fabric.pub</code> channel</a> for anyone with the desire to learn!' }
    ],
    [
      { h3: 'Finding Us Elsewhere' },
      { p: 'As we prepare for launch, we\'ll make announcements through <a href="https://twitter.com/FabricProtocol" rel="me">our official Twitter</a>, but many other materials are available in the meantime.  See below, or see you around!' },
      { p: '&mdash; the Fabric Team', style: 'text-align: right;' },
      {
        links: [
          { href: 'https://github.com/FabricLabs', label: 'GitHub' },
          { href: 'https://fabric.fm', label: 'Mailing List' },
          { href: 'https://dev.fabric.pub', label: 'Documentation' },
          { href: 'https://twitter.com/FabricProtocol', label: '@FabricProtocol' }
        ]
      }
    ]
  ],
  // Unpublished sections, kept in the page source as HTML comments.
  drafts: [
    [
      { h2: 'Serverless?' },
      { p: 'Tired of the risks imposed by trusted third parties, we\'ve decided to design a new software architecture that is <strong>easier to use</strong>, <strong>safer to run</strong>, and <strong>more resilient to attack</strong>.' },
      { p: 'To accomplish our goals, we\'re removing servers from the equation and going <strong>entirely peer-to-peer</strong>.' },
      { h3: 'Encrypted by Default' },
      { p: 'Fabric uses high-power encryption to secure communications across the network, ensuring that <em>user privacy is preserved by default</em>.' },
      { h3: 'People over Profit' },
      { p: 'Rather than enforcing arbitrary decisions "for the good of the community", Fabric is an open-source, offline-first protocol that gives users the ultimate power of their own experiences.  Applications published in the Fabric network are shared as "source code", with their behaviors and functionality clearly described in human-readible form.' }
    ]
  ]
};

const BLOCK_TAGS = ['h2', 'h3', 'p'];

function escapeHtml (value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
    }, DEFAULTS, settings);

    this._state = {
      content: {
        title: this.settings.title,
        url: this.settings.url,
        description: this.settings.description,
        image: this.settings.image,
        stylesheets: this.settings.stylesheets,
        heading: this.settings.heading,
        subtitle: this.settings.subtitle,
        sections: this.settings.sections,
        drafts: this.settings.drafts
      }
    };

    return this;
  }

  _renderBlock (block) {
    if (block.links) {
      const items = block.links
        .map((link) => `            <li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
        .join('\n');
      return `        <p>
          <ul>
${items}
          </ul>
        </p>`;
    }

    const tag = BLOCK_TAGS.find((name) => block[name] !== undefined);
    if (!tag) throw new Error(`Unknown block: ${JSON.stringify(block)}`);
    const style = block.style ? ` style="${escapeHtml(block.style)}"` : '';
    return `        <${tag}${style}>${block[tag]}</${tag}>`;
  }

  _renderBlocks (blocks) {
    return blocks.map((block, index) => {
      const html = this._renderBlock(block);
      const isHeading = block.h2 !== undefined || block.h3 !== undefined;
      return (index > 0 && isHeading) ? `\n${html}` : html;
    }).join('\n');
  }

  _renderSection (blocks) {
    return `      <section>
${this._renderBlocks(blocks)}
      </section>`;
  }

  _renderDraft (blocks) {
    return `      <!-- <section>
${this._renderBlocks(blocks)}
      </section> -->`;
  }

  /**
   * Render the page body.
   * @param {Object} [state] Page state; missing fields fall back to the component's.
   * @returns {String} The `<article>` element.
   */
  _getInnerHTML (state) {
    const page = Object.assign({}, this.state, state || {});
    const sections = page.sections.map((blocks) => this._renderSection(blocks))
      .concat(page.drafts.map((blocks) => this._renderDraft(blocks)));

    return `<article>
      <h1>${page.heading}</h1>
      <p class="subtitle">${page.subtitle}</p>

${sections.join('\n\n')}
    </article>`;
  }

  /**
   * Render the full HTML document for `assets/index.html`.
   * @param {Object} [state] Page state; missing fields fall back to the component's.
   * @returns {String} HTML document.
   */
  toHTML (state) {
    const page = Object.assign({}, this.state, state || {});
    const stylesheets = page.stylesheets
      .map((href) => `    <link rel="stylesheet" href="${escapeHtml(href)}" />`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${page.title}</title>
${stylesheets}
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:url" content="${escapeHtml(page.url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:image" content="${escapeHtml(page.image)}" />
  </head>

  <body>
    ${this._getInnerHTML(page)}
  </body>
</html>
`;
  }
}

HomePage.DEFAULTS = DEFAULTS;

module.exports = HomePage;
