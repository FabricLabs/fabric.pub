'use strict';

// The page runs no scripts and loads only its own styles, fonts, and images.
const CSP = "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

const BLOCK_TAGS = ['h2', 'h3', 'p'];

function escapeHtml (value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlock (block) {
  if (block.links) {
    const items = block.links
      .map((link) => `            <li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
      .join('\n');
    return `        <ul class="links">
${items}
        </ul>`;
  }

  if (block.list) {
    const items = block.list.map((item) => `            <li>${item}</li>`).join('\n');
    return `        <ul>
${items}
        </ul>`;
  }

  if (block.catalog) {
    const items = block.catalog.map((item) => `          <li>
            <a href="${escapeHtml(item.href)}">
              <span class="num">${escapeHtml(item.num)}</span>
              <span class="catalog-body">
                <strong>${escapeHtml(item.title)}</strong>
                <span class="deck">${escapeHtml(item.deck)}</span>
              </span>
            </a>
          </li>`).join('\n');
    return `        <ol class="catalog">
${items}
        </ol>`;
  }

  if (block.code !== undefined) {
    return `        <pre><code>${escapeHtml(block.code)}</code></pre>`;
  }

  if (block.limit !== undefined) {
    return `        <p class="limit">${block.limit}</p>`;
  }

  if (block.next) {
    return `        <p class="next"><a href="${escapeHtml(block.next.href)}">${escapeHtml(block.next.label)}</a></p>`;
  }

  const tag = BLOCK_TAGS.find((name) => block[name] !== undefined);
  if (!tag) throw new Error(`Unknown block: ${JSON.stringify(block)}`);
  return `        <${tag}>${block[tag]}</${tag}>`;
}

function renderBlocks (blocks) {
  return blocks.map((block) => renderBlock(block)).join('\n');
}

function renderSection (blocks) {
  return `      <section>
${renderBlocks(blocks)}
      </section>`;
}

/**
 * The `<article>` for a page. Heading and subtitle are trusted HTML.
 * @param {Object} page
 * @returns {String}
 */
function renderArticle (page) {
  const kicker = page.kicker ? `      <p class="kicker">${escapeHtml(page.kicker)}</p>\n` : '';
  const sections = (page.sections || []).map((blocks) => renderSection(blocks)).join('\n\n');
  return `<article>
${kicker}      <h1>${page.heading}</h1>
      <p class="subtitle">${page.subtitle}</p>

${sections}
    </article>`;
}

/**
 * Full HTML document. `title` may contain trusted entities such as `&bull;`.
 * @param {Object} page
 * @returns {String}
 */
function renderDocument (page) {
  const stylesheets = (page.stylesheets || ['/site.css'])
    .map((href) => `    <link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join('\n');
  const learnCurrent = String(page.path || '').startsWith('/learn') ? ' aria-current="page"' : '';
  const image = page.image
    ? `    <meta property="og:image" content="${escapeHtml(page.image)}" />\n`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <title>${page.title}</title>
${stylesheets}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="theme-color" content="#4C1D95" />
    <link rel="canonical" href="${escapeHtml(page.url)}" />
    <meta property="og:url" content="${escapeHtml(page.url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${String(page.title).replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
${image}  </head>

  <body>
    <a class="skip" href="#content">Skip to content</a>
    <div class="wrap">
      <header class="mast">
        <a class="mark" href="/"><img src="/favicon.svg" width="28" height="28" alt="" /> Fabric</a>
        <nav>
          <a href="/learn/"${learnCurrent}>Learn</a>
        </nav>
      </header>
      <main id="content">
        ${page.article}
      </main>
      <footer>
        <p><a href="/">Fabric</a> · <a href="https://github.com/FabricLabs">Fabric Labs on GitHub</a></p>
      </footer>
    </div>
  </body>
</html>
`;
}

module.exports = {
  CSP,
  escapeHtml,
  renderArticle,
  renderBlock,
  renderDocument
};
