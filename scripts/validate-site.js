'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];

function walk(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.name.startsWith('.')
      || entry.name === 'node_modules'
      || entry.name === 'planner-app'
      || entry.name === 'dist'
    ) return [];
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute, relative) : [relative];
  });
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function decodeText(value) {
  return (value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&(?:mdash|ndash);/gi, '-')
    .replace(/&#\d+;|&#x[0-9a-f]+;/gi, ' ')
    .trim();
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
  if (title) assert(decodeText(title).length <= 65, `${file}: title exceeds 65 characters`);
  if (description) {
    const length = decodeText(description).length;
    assert(length >= 80 && length <= 165, `${file}: meta description is ${length} characters`);
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  assert(h1Count === 1, `${file}: expected one h1, found ${h1Count}`);

  [...html.matchAll(/<img\b[^>]*>/gi)].forEach((match) => {
    assert(/\balt=(?:"[^"]*"|'[^']*')/i.test(match[0]), `${file}: image is missing alt text`);
  });

  [...html.matchAll(/<a\b[^>]*\btarget="_blank"[^>]*>/gi)].forEach((match) => {
    const rel = match[0].match(/\brel="([^"]*)"/i)?.[1] || '';
    assert(/\bnoopener\b/i.test(rel), `${file}: target=_blank link is missing noopener`);
  });

  const renderedLogoReferences = [...html.matchAll(/<(?:img|link)\b[^>]*(?:src|href)="([^"]*Logo(?:-256)?\.png)"[^>]*>/gi)];
  renderedLogoReferences.forEach((match) => {
    assert(/Logo-256\.png$/i.test(match[1]), `${file}: rendered logo does not use the optimized asset`);
  });

  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert(duplicateIds.length === 0, `${file}: duplicate ids ${[...new Set(duplicateIds)].join(', ')}`);

  [...html.matchAll(/\b(?:href|src)="([^"]+)"/gi)].forEach((match) => {
    const target = resolveLocalTarget(file, match[1]);
    if (target) {
      const isBuiltPlannerRoute = target === 'planner/index.html';
      assert(fileSet.has(target) || isBuiltPlannerRoute, `${file}: broken local target ${match[1]} -> ${target}`);
    }
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
  ['why-it-matters', 'how-it-works', 'practical-example', 'build-your-plan', 'what-to-watch-for', 'sources'].forEach((id) => {
    assert(articleText.includes(`id="${id}"`), `${file}: missing essential guide section ${id}`);
  });
  assert(/<ol class="decision-steps">[\s\S]*?<li/.test(articleText), `${file}: missing actionable checklist`);
  assert(/<ul class="source-list">[\s\S]*?<a href="https:\/\//.test(articleText), `${file}: missing linked source`);
  assert(!articleText.includes('Your four-part worksheet'), `${file}: contains repetitive worksheet boilerplate`);
  assert(!/<details class="guide-detail"[^>]*\sopen(?:\s|>)/.test(articleText), `${file}: extra guide detail should start collapsed`);
});

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const optimizedLogo = path.join(root, 'Logo-256.png');
assert(fs.existsSync(optimizedLogo), 'missing optimized Logo-256.png asset');
if (fs.existsSync(optimizedLogo)) {
  assert(fs.statSync(optimizedLogo).size < 100 * 1024, 'Logo-256.png exceeds 100 KB');
}
assert((sitemap.match(/\/guides\/[^<]+\.html/g) || []).length === 42, 'sitemap does not contain 42 guide URLs');
assert(!/article\.html\?id=/i.test(sitemap), 'sitemap contains legacy query article URLs');
assert(!/(?:earn|rewards)\.html/i.test(sitemap), 'sitemap contains referral-only pages');
assert(!/journal\.html/i.test(sitemap), 'sitemap contains the Substack outbound landing page');
assert(sitemap.includes('/cash-flow.html'), 'sitemap is missing the cash-flow planner');
assert(sitemap.includes('/planner/'), 'sitemap is missing Accessible Finance Planner');
assert(sitemap.includes('/editorial-policy.html'), 'sitemap is missing the editorial policy');
assert(sitemap.includes('/contact.html'), 'sitemap is missing the contact page');

const referralPages = ['earn.html', 'us/rewards.html'];
referralPages.forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert(/<meta name="robots" content="noindex,follow">/i.test(html), `${file}: missing noindex,follow`);
  assert(!/pagead2\.googlesyndication\.com/i.test(html), `${file}: AdSense loader must not appear`);
  assert(/rel="[^"]*sponsored[^"]*nofollow/i.test(html), `${file}: referral link is missing sponsored/nofollow`);
});

[
  ['index.html', 'earn.html'],
  ['cash-flow.html', 'earn.html'],
  ['guides/asset-allocation.html', '../earn.html'],
  ['us/index.html', 'rewards.html'],
].forEach(([file, href]) => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const rewardsLinks = html.match(/data-region-rewards/g) || [];
  assert(rewardsLinks.length === 3, `${file}: expected Rewards links in desktop, mobile, and footer navigation`);
  assert(html.includes(`href="${href}" data-region-rewards`), `${file}: Rewards navigation points to the wrong edition`);
});

const regionScript = fs.readFileSync(path.join(root, 'site-region.js'), 'utf8');
assert(/data-region-rewards/i.test(regionScript), 'site-region.js: missing universal Rewards link handling');
assert(/us\/rewards\.html/i.test(regionScript), 'site-region.js: missing U.S. Rewards destination');

const shellScript = fs.readFileSync(path.join(root, 'site-shell.js'), 'utf8');
assert(/data-planner-link/i.test(shellScript), 'site-shell.js: missing shared Planner navigation');
assert(/new URL\('planner\//i.test(shellScript), 'site-shell.js: Planner link is not site-root aware');

['about.html', 'articles.html', 'journal.html', 'topic.html', 'privacy.html', 'disclaimer.html', 'editorial-policy.html', 'contact.html', '404.html']
  .forEach((file) => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert(!/pagead2\.googlesyndication\.com/i.test(html), `${file}: AdSense loader must not appear`);
  });

const journal = fs.readFileSync(path.join(root, 'journal.html'), 'utf8');
assert(/<meta name="robots" content="noindex,follow">/i.test(journal), 'journal.html: missing noindex,follow');
assert(/<h1[^>]*>The Dispatch\./i.test(journal), 'journal.html: missing Dispatch heading');
assert(!/coming soon|work in progress|archive is being prepared/i.test(journal), 'journal.html: obsolete placeholder copy remains');
assert(/href="https:\/\/accessiblefinance\.substack\.com\/"[^>]*target="_blank"/i.test(journal), 'journal.html: missing direct Dispatch link');
const startHere = fs.readFileSync(path.join(root, 'start-here.html'), 'utf8');
assert(!/name="robots" content="noindex/i.test(startHere), 'start-here.html: beginner paths should be indexable');
['spending', 'unexpected-costs', 'investing', 'retirement-accounts'].forEach((id) => {
  assert(startHere.includes(`id="${id}"`), `start-here.html: missing learning path ${id}`);
});

const cashFlow = fs.readFileSync(path.join(root, 'cash-flow.html'), 'utf8');
assert(/<h1[^>]*>[\s\S]*money/i.test(cashFlow), 'cash-flow.html: missing cash-flow heading');
assert(/id="sankeyChart"/i.test(cashFlow), 'cash-flow.html: missing Sankey chart');
assert(/data-region-universal/i.test(cashFlow), 'cash-flow.html: missing universal-edition marker');
const cashFlowScript = fs.readFileSync(path.join(root, 'cash-flow.js'), 'utf8');
assert(/d3-sankey@0\.12\.3/i.test(cashFlowScript), 'cash-flow.js: missing pinned Sankey library');
assert(!/<script[^>]+src="https:\/\/cdn\.jsdelivr\.net\/npm\/d3/i.test(cashFlow), 'cash-flow.html: chart libraries must load on demand');
assert(/cash-flow\.html\?edition=ca/i.test(cashFlow), 'cash-flow.html: missing Cash Flow navigation link');
assert(!/id="currencySelect"/i.test(cashFlow), 'cash-flow.html: obsolete currency selector is present');

const cashFlowSchemas = [...cashFlow.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
assert(cashFlowSchemas.length > 0, 'cash-flow.html: missing structured data');
cashFlowSchemas.forEach((match, index) => {
  try {
    JSON.parse(match[1]);
  } catch (error) {
    errors.push(`cash-flow.html: structured data block ${index + 1} is invalid JSON (${error.message})`);
  }
});

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
