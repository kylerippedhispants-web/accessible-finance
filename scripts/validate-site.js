'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];

function walk(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute, relative) : [relative];
  });
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function resolveLocalTarget(fromFile, rawTarget) {
  if (!rawTarget || /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(rawTarget)) return null;
  const cleanTarget = rawTarget.split('#')[0].split('?')[0];
  if (!cleanTarget) return null;
  const decoded = decodeURIComponent(cleanTarget);
  const relative = decoded.startsWith('/')
    ? decoded.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decoded));
  if (!relative || relative === '.') return 'index.html';
  return relative.endsWith('/') ? `${relative}index.html` : relative;
}

const allFiles = walk(root);
const fileSet = new Set(allFiles);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const guideFiles = htmlFiles.filter((file) => file.startsWith('guides/'));

htmlFiles.forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]*)"/i)?.[1]?.trim();
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/gi)];
  assert(title, `${file}: missing title`);
  assert(description, `${file}: missing meta description`);
  assert(canonicals.length === 1, `${file}: expected one canonical, found ${canonicals.length}`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert(duplicateIds.length === 0, `${file}: duplicate ids ${[...new Set(duplicateIds)].join(', ')}`);

  [...html.matchAll(/\b(?:href|src)="([^"]+)"/gi)].forEach((match) => {
    const target = resolveLocalTarget(file, match[1]);
    if (target) assert(fileSet.has(target), `${file}: broken local target ${match[1]} -> ${target}`);
  });
});

assert(guideFiles.length === 42, `expected 42 static guides, found ${guideFiles.length}`);
guideFiles.forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const canonicalSlug = file.replace(/\\/g, '/');
  assert(
    html.includes(`https://accessible-finance.com/${canonicalSlug}`),
    `${file}: canonical does not match the static path`
  );
  assert(html.includes('By Accessible Finance'), `${file}: missing publisher byline`);
  assert(html.includes('Sources and further reading'), `${file}: missing source section`);
  assert(html.includes('type="application/ld+json"'), `${file}: missing structured data`);
  assert(!/article\.html\?id=/i.test(html), `${file}: contains a legacy query article link`);

  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  schemas.forEach((match, index) => {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${file}: structured data block ${index + 1} is invalid JSON (${error.message})`);
    }
  });

  const articleText = html.match(/<article class="article-body">([\s\S]*?)<\/article>/i)?.[1] || '';
  const words = articleText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
  assert(words.length >= 800, `${file}: only ${words.length} visible article words`);
});

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert((sitemap.match(/\/guides\/[^<]+\.html/g) || []).length === 42, 'sitemap does not contain 42 guide URLs');
assert(!/article\.html\?id=/i.test(sitemap), 'sitemap contains legacy query article URLs');
assert(!/(?:earn|rewards)\.html/i.test(sitemap), 'sitemap contains referral-only pages');
assert(!/journal\.html/i.test(sitemap), 'sitemap contains the unfinished Articles placeholder');
assert(sitemap.includes('/editorial-policy.html'), 'sitemap is missing the editorial policy');
assert(sitemap.includes('/contact.html'), 'sitemap is missing the contact page');

const referralPages = ['earn.html', 'us/rewards.html'];
referralPages.forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert(/<meta name="robots" content="noindex,follow">/i.test(html), `${file}: missing noindex,follow`);
  assert(!/pagead2\.googlesyndication\.com/i.test(html), `${file}: AdSense loader must not appear`);
  assert(/rel="[^"]*sponsored[^"]*nofollow/i.test(html), `${file}: referral link is missing sponsored/nofollow`);
});

['about.html', 'articles.html', 'journal.html', 'topic.html', 'privacy.html', 'disclaimer.html', 'editorial-policy.html', 'contact.html', '404.html']
  .forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert(!/pagead2\.googlesyndication\.com/i.test(html), `${file}: AdSense loader must not appear`);
  });

const journal = fs.readFileSync(path.join(root, 'journal.html'), 'utf8');
assert(/<meta name="robots" content="noindex,follow">/i.test(journal), 'journal.html: missing noindex,follow');
assert(/<h1[^>]*>[\s\S]*Articles/i.test(journal), 'journal.html: missing Articles heading');
assert(/Work in progress/i.test(journal), 'journal.html: missing work-in-progress state');

const combinedHtml = htmlFiles
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
[
  '120+ guides',
  '40K readers',
  'First 50 guides published',
  'Products promoted',
  'same standards as the best financial journalism',
  'article.html?id=',
].forEach((claim) => {
  assert(!combinedHtml.toLowerCase().includes(claim.toLowerCase()), `outdated or unsupported claim remains: ${claim}`);
});

assert(
  fs.readFileSync(path.join(root, 'ads.txt'), 'utf8').trim()
    === 'google.com, pub-4537695061199720, DIRECT, f08c47fec0942fa0',
  'ads.txt is missing or malformed'
);

if (errors.length) {
  process.stderr.write(`${errors.length} validation error(s):\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}

process.stdout.write(
  `Validated ${htmlFiles.length} HTML pages, ${guideFiles.length} static guides, local links, schemas, sitemap, referral isolation, and ads.txt.\n`
);
