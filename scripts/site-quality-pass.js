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
      /<li>\s*<a href="(?:\.\.\/)?(?:earn|rewards)\.html"[^>]*>\s*Rewards(?:\s*<span[\s\S]*?<\/span>)?\s*<\/a>\s*<\/li>/gi,
      ''
    )
    .replace(
      /<a href="(?:\.\.\/)?(?:earn|rewards)\.html"[^>]*>\s*Rewards(?:\s*<span[\s\S]*?<\/span>)?\s*<\/a>/gi,
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

function cleanNewsletterClaims(html) {
  return html
    .replace(/Weekly Newsletter/gi, 'The Dispatch')
    .replace(/The weekly dispatch/gi, 'The Dispatch')
    .replace(/The Dispatch\s*[·&]?(?:middot;)?\s*Weekly/gi, 'The Dispatch')
    .replace(/No hype\. No sales\. Just one clear concept per week\./gi, 'New guides and practical notes, sent occasionally. No spam or sales pitch.')
    .replace(/Latest Posts/gi, 'Guide Library');
}

function normalizeListIndentation(html) {
  return html.replace(/^<li>/gm, '          <li>');
}

function processFile(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const absolutePath = path.join(root, relativePath);
  const isRewardsPage = normalizedPath === 'earn.html' || normalizedPath === 'us/rewards.html';
  let html = fs.readFileSync(absolutePath, 'utf8');

  html = html.replace(
    /<html lang="[^"]*">/i,
    `<html lang="${normalizedPath.startsWith('us/') ? 'en-US' : 'en-CA'}">`
  );
  html = cleanNewsletterClaims(html);
  if (!isRewardsPage) html = removeRewardsLinks(html);
  html = addTrustLinks(html);
  html = addArticlesNavigation(html, normalizedPath);
  html = addCashFlowNavigation(html, normalizedPath);
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
