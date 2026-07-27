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
  'privacy.html',
  'topic.html',
  'us/rewards.html',
]);
const noIndex = new Set([
  '404.html',
  'article.html',
  'earn.html',
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
    .replace(/<li><a href="(?:\.\.\/)?editorial-policy\.html">Editorial standards<\/a><\/li>/gi, '')
    .replace(/<li><a href="(?:\.\.\/)?contact\.html">Contact &amp; corrections<\/a><\/li>/gi, '');

  return html.replace(
    /<li><a href="((?:\.\.\/)?)about\.html">About<\/a><\/li>/gi,
    (match, prefix) => `${match}
          <li><a href="${prefix}editorial-policy.html">Editorial standards</a></li>
          <li><a href="${prefix}contact.html">Contact &amp; corrections</a></li>`
  );
}

function cleanNewsletterClaims(html) {
  return html
    .replace(/Weekly Newsletter/gi, 'The Dispatch')
    .replace(/The weekly dispatch/gi, 'The Dispatch')
    .replace(/The Dispatch\s*[·&]?(?:middot;)?\s*Weekly/gi, 'The Dispatch')
    .replace(/No hype\. No sales\. Just one clear concept per week\./gi, 'New guides and practical notes, sent occasionally. No spam or sales pitch.')
    .replace(/Latest Posts/gi, 'Guide Library');
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
