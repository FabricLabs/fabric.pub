'use strict';

const HomePage = require('./HomePage');
const { learnDocuments } = require('./learn');

/**
 * Every HTML document the build writes.
 * @returns {Array<{ file: String, path: String, html: String }>}
 */
function siteDocuments () {
  const home = new HomePage();
  return [
    { file: 'assets/index.html', path: '/', html: home.toHTML() }
  ].concat(learnDocuments());
}

module.exports = { siteDocuments };
