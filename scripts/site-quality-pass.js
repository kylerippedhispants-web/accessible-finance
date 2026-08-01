'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const noAds = new Set([
  '404.html',
  'about.html',
  'article.html',
  'articles.html',
  'contact.html',
  'disclaimer.html',
  'earn.html',
  'editorial-policy.html',
  'journal.html',
  'privacy.html',
  'topic.html',
  'us/rewards.html',
]);
const noIndex = new Set([
  '404.html',
  'article.html',
  'earn.html',
  'journal.html',
  'us/rewards.html',
]);

function listHtml(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtml(absolutePath, relativePath);
    return entry.name.endsWith('.html') ? [relativePath] : [];
  });
}

function removeAdsense(html) {
  return html.replace(
    /<script async src="https:\/\/pagead2\.googlesyndication\.com[\s\S]*?<\/script>\s*/gi,
    ''
  );
}

function addRobots(html, value) {
  if (/<meta name="robots"/i.test(html)) {
    return html.replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${value}">`);
  }
  return html.replace(
    /(<meta name="viewport"[^>]*>)/i,
    `$1\n<meta name="robots" content="${value}">`
  );
}

function removeRewardsLinks(html) {
  return html
    .replace(
      /^[ \t]*<li>\s*<a href="(?:\.\.\/)?(?:earn|rewards)\.html"[^>]*>\s*Rewards(?:\s*<span[\s\S]*?<\/span>)?\s*<\/a>\s*<\/li>[ \t]*\r?\n/gim,
      ''
    )
    .replace(
      /^[ \t]*<a href="(?:\.\.\/)?(?:earn|rewards)\.html"[^>]*>\s*Rewards(?:\s*<span[\s\S]*?<\/span>)?\s*<\/a>[ \t]*\r?\n/gim,
      ''
    )
    .replace(
      /<li>[ \t]*<a href="(?:\.\.\/)?(?:earn|rewards)\.html"[^>]*>[ \t]*Rewards(?:[ \t]*<span[\s\S]*?<\/span>)?[ \t]*<\/a>[ \t]*<\/li>/gi,
      ''
    )
    .replace(
      /[ \t]*<a href="(?:\.\.\/)?(?:earn|rewards)\.html"[^>]*>[ \t]*Rewards(?:[ \t]*<span[\s\S]*?<\/span>)?[ \t]*<\/a>[ \t]*/gi,
      ''
    );
}

function addTrustLinks(html) {
  html = html
    .replace(
      /^[ \t]*<li><a href="(?:\.\.\/)?editorial-policy\.html">Editorial standards<\/a><\/li>[ \t]*\r?\n/gim,
      ''
    )
    .replace(
      /^[ \t]*<li><a href="(?:\.\.\/)?contact\.html">Contact &amp; corrections<\/a><\/li>[ \t]*\r?\n/gim,
      ''
    );

  return html.replace(
    /<li><a href="((?:\.\.\/)?)about\.html">About<\/a><\/li>/gi,
    (match, prefix) => `${match}
          <li><a href="${prefix}editorial-policy.html">Editorial standards</a></li>
          <li><a href="${prefix}contact.html">Contact &amp; corrections</a></li>`
  );
}

function addArticlesNavigation(html, normalizedPath) {
  const nested = normalizedPath.startsWith('guides/') || normalizedPath.startsWith('us/');
  const prefix = nested ? '../' : '';
  const desktopLink = normalizedPath === 'journal.html'
    ? `<a href="${prefix}journal.html" class="active" aria-current="page">Articles</a>`
    : `<a href="${prefix}journal.html">Articles</a>`;
  const mobileLink = normalizedPath === 'journal.html'
    ? `<a href="${prefix}journal.html" aria-current="page">Articles</a>`
    : `<a href="${prefix}journal.html">Articles</a>`;

  html = html.replace(
    /\s*<a href="(?:\.\.\/)?journal\.html"[^>]*>\s*Articles\s*<\/a>/gi,
    ''
  );

  if (normalizedPath.startsWith('us/')) {
    html = html.replace(
      /(<div class="nav-links">[\s\S]*?<a href="index\.html"[^>]*>\s*Home\s*<\/a>)/i,
      `$1\n    ${desktopLink}`
    );
    html = html.replace(
      /(<div class="mobile-menu"[^>]*>[\s\S]*?<a href="index\.html"[^>]*>\s*Home\s*<\/a>)/i,
      `$1\n  ${mobileLink}`
    );
  } else {
    html = html.replace(
      /(<div class="nav-links">[\s\S]*?<a href="(?:\.\.\/)?articles\.html"[^>]*>\s*Guides\s*<\/a>)/i,
      `$1\n    ${desktopLink}`
    );
    html = html.replace(
      /(<div class="mobile-menu"[^>]*>[\s\S]*?<a href="(?:\.\.\/)?articles\.html"[^>]*>\s*Guides\s*<\/a>)/i,
      `$1\n  ${mobileLink}`
    );
  }

  return html.replace(/<h4>Articles<\/h4>/g, '<h4>Guides</h4>');
}

function addCashFlowNavigation(html, normalizedPath) {
  const isUsPage = normalizedPath.startsWith('us/');
  const nested = normalizedPath.startsWith('guides/') || isUsPage;
  const prefix = nested ? '../' : '';
  const edition = isUsPage ? 'us' : 'ca';
  const href = `${prefix}cash-flow.html?edition=${edition}`;
  const isActive = normalizedPath === 'cash-flow.html';
  const desktopLink = isActive
    ? `<a href="${href}" class="active" aria-current="page">Cash Flow</a>`
    : `<a href="${href}">Cash Flow</a>`;
  const mobileLink = isActive
    ? `<a href="${href}" aria-current="page">Cash Flow</a>`
    : `<a href="${href}">Cash Flow</a>`;

  html = html
    .replace(
      /^[ \t]*<li><a href="(?:\.\.\/)?cash-flow\.html(?:\?edition=(?:ca|us))?"[^>]*>\s*Cash Flow\s*<\/a><\/li>[ \t]*\r?\n/gim,
      ''
    )
    .replace(
      /\s*<a href="(?:\.\.\/)?cash-flow\.html(?:\?edition=(?:ca|us))?"[^>]*>\s*Cash Flow\s*<\/a>/gi,
      ''
    );

  html = html.replace(
    /(<div class="nav-links">[\s\S]*?<a href="(?:\.\.\/)?(?:us\/)?tax-calculator\.html"[^>]*>\s*Tax\s*<\/a>)/i,
    `$1\n    ${desktopLink}`
  );
  html = html.replace(
    /(<div class="mobile-menu"[^>]*>[\s\S]*?<a href="(?:\.\.\/)?(?:us\/)?tax-calculator\.html"[^>]*>\s*Tax\s*<\/a>)/i,
    `$1\n  ${mobileLink}`
  );
  html = html.replace(
    /(<li><a href="(?:\.\.\/)?(?:us\/)?tax-calculator\.html">Tax Calculator<\/a><\/li>)/gi,
    `$1\n          <li><a href="${href}">Cash Flow</a></li>`
  );

  return html;
}

function addRewardsNavigation(html, normalizedPath) {
  const isUsPage = normalizedPath.startsWith('us/');
  const nested = normalizedPath.startsWith('guides/');
  const prefix = nested ? '../' : '';
  const href = isUsPage ? 'rewards.html' : `${prefix}earn.html`;
  const isActive = normalizedPath === 'earn.html' || normalizedPath === 'us/rewards.html';
  const desktopLink = isActive
    ? `<a href="${href}" data-region-rewards class="active" aria-current="page">Rewards <span aria-hidden="true">&#x1F4B8;</span></a>`
    : `<a href="${href}" data-region-rewards>Rewards <span aria-hidden="true">&#x1F4B8;</span></a>`;
  const mobileLink = isActive
    ? `<a href="${href}" data-region-rewards aria-current="page">Rewards <span aria-hidden="true">&#x1F4B8;</span></a>`
    : `<a href="${href}" data-region-rewards>Rewards <span aria-hidden="true">&#x1F4B8;</span></a>`;
  const footerLink = `<li><a href="${href}" data-region-rewards>Rewards <span aria-hidden="true">&#x1F4B8;</span></a></li>`;

  html = removeRewardsLinks(html)
    .replace(/<li>[ \t]*<\/li>/gi, '')
    .replace(/(Cash Flow\s*<\/a>(?:<\/li>)?)(?:[ \t]*\r?\n){2,}/gi, '$1\n');
  html = html.replace(
    /(<div class="nav-links">[\s\S]*?<a href="(?:\.\.\/)?cash-flow\.html(?:\?edition=(?:ca|us))?"[^>]*>\s*Cash Flow\s*<\/a>)/i,
    `$1\n    ${desktopLink}`
  );
  html = html.replace(
    /(<div class="mobile-menu"[^>]*>[\s\S]*?<a href="(?:\.\.\/)?cash-flow\.html(?:\?edition=(?:ca|us))?"[^>]*>\s*Cash Flow\s*<\/a>)/i,
    `$1\n  ${mobileLink}`
  );
  html = html.replace(
    /(<li><a href="(?:\.\.\/)?cash-flow\.html(?:\?edition=(?:ca|us))?"[^>]*>\s*Cash Flow\s*<\/a><\/li>)/gi,
    `$1\n          ${footerLink}`
  );

  return html;
}

function cleanNewsletterClaims(html) {
  return html
    .replace(/Weekly Newsletter/gi, 'The Dispatch')
    .replace(/The weekly dispatch/gi, 'The Dispatch')
    .replace(/The Dispatch\s*[·&]?(?:middot;)?\s*Weekly/gi, 'The Dispatch')
    .replace(/No hype\. No sales\. Just one clear concept per week\./gi, 'New guides and practical notes, sent occasionally. No spam or sales pitch.')
    .replace(/Latest Posts/gi, 'Guide Library');
}

function optimizeLogoReferences(html) {
  html = html.replace(
    /(<img\b[^>]*\bsrc=")((?:\.\.\/)?Logo)\.png(")/gi,
    '$1$2-256.png$3'
  );
  html = html.replace(
    /(<link\b(?=[^>]*\brel="icon")[^>]*\bhref=")((?:\.\.\/)?Logo)\.png(")/gi,
    '$1$2-256.png$3'
  );

  return html.replace(/<img\b([^>]*\bsrc="(?:\.\.\/)?Logo-256\.png"[^>]*)>/gi, (match, attributes) => {
    const cleanAttributes = attributes
      .replace(/\s+(?:width|height|decoding)="[^"]*"/gi, '')
      .trimEnd();
    return `<img${cleanAttributes} width="256" height="256" decoding="async">`;
  });
}

function versionSharedAssets(html) {
  return html.replace(
    /((?:href|src)=")((?:\.\.\/)?site-(?:polish|language|region)\.(?:css|js)|(?:\.\.\/)?site-shell\.js)(?:\?v=[^"]*)?"/gi,
    '$1$2?v=20260801"'
  );
}

function normalizeListIndentation(html) {
  return html.replace(/^<li>/gm, '          <li>');
}

function processFile(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const absolutePath = path.join(root, relativePath);
  let html = fs.readFileSync(absolutePath, 'utf8');

  html = html.replace(
    /<html lang="[^"]*">/i,
    `<html lang="${normalizedPath.startsWith('us/') ? 'en-US' : 'en-CA'}">`
  );
  html = cleanNewsletterClaims(html);
  html = optimizeLogoReferences(html);
  html = versionSharedAssets(html);
  html = addTrustLinks(html);
  html = addArticlesNavigation(html, normalizedPath);
  html = addCashFlowNavigation(html, normalizedPath);
  html = addRewardsNavigation(html, normalizedPath);
  html = normalizeListIndentation(html);
  if (noAds.has(normalizedPath)) html = removeAdsense(html);
  if (noIndex.has(normalizedPath)) html = addRobots(html, 'noindex,follow');

  fs.writeFileSync(
    absolutePath,
    html.replace(/\r?\n/g, '\n').replace(/[ \t]+$/gm, ''),
    'utf8'
  );
}

const files = listHtml(root);
files.forEach(processFile);
process.stdout.write(`Applied site quality rules to ${files.length} HTML files.\n`);
