'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const guideDirectory = path.join(root, 'guides');
const reviewedDate = '2026-07-27';
const adsenseLoader = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4537695061199720"
     crossorigin="anonymous"></script>`;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content.replace(/\r?\n/g, '\n'), 'utf8');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadGuideBuild() {
  const context = vm.createContext({
    window: { __AccessibleFinanceBuildMode: true },
  });

  [
    'article-expansions.js',
    'article-depth.js',
    'article-perspectives.js',
    'article-library.js',
  ].forEach((file) => {
    vm.runInContext(read(file), context, { filename: file });
  });

  if (!context.window.AccessibleFinanceGuideBuild) {
    throw new Error('The article library did not expose its build API.');
  }
  return context.window.AccessibleFinanceGuideBuild;
}

function replaceRegion(html, name, content) {
  const pattern = new RegExp(`<!-- ${name}_START -->[\\s\\S]*?<!-- ${name}_END -->`);
  if (!pattern.test(html)) throw new Error(`Missing ${name} markers in article.html`);
  return html.replace(
    pattern,
    `<!-- ${name}_START -->\n${content}\n  <!-- ${name}_END -->`
  );
}

function removeRegion(html, name) {
  const pattern = new RegExp(`\\s*<!-- ${name}_START -->[\\s\\S]*?<!-- ${name}_END -->`);
  if (!pattern.test(html)) throw new Error(`Missing ${name} markers in article.html`);
  return html.replace(pattern, '');
}

function prefixTemplatePaths(html) {
  return html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, value) => {
    if (/^(?:https?:|#|mailto:|tel:|data:|\/)/i.test(value)) return match;
    return `${attribute}="../${value}"`;
  });
}

function getRelatedIds(id, item, guides) {
  const relatedIds = (item.related || [])
    .filter((relatedId) => guides[relatedId] && relatedId !== id)
    .slice(0, 3);

  if (relatedIds.length < 3) {
    Object.keys(guides).some((candidateId) => {
      if (
        candidateId !== id
        && !relatedIds.includes(candidateId)
        && guides[candidateId].category === item.category
      ) {
        relatedIds.push(candidateId);
      }
      return relatedIds.length === 3;
    });
  }

  return relatedIds;
}

function buildStructuredData(id, item, wordCount, readingMinutes) {
  const url = `https://accessible-finance.com/guides/${id}.html`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: item.title,
        description: item.deck,
        url,
        mainEntityOfPage: url,
        inLanguage: 'en-CA',
        articleSection: item.category,
        wordCount,
        timeRequired: `PT${readingMinutes}M`,
        dateModified: reviewedDate,
        isAccessibleForFree: true,
        author: {
          '@type': 'Organization',
          name: 'Accessible Finance',
          url: 'https://accessible-finance.com/about.html',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Accessible Finance',
          url: 'https://accessible-finance.com/',
          logo: {
            '@type': 'ImageObject',
            url: 'https://accessible-finance.com/Logo.png',
          },
        },
        image: 'https://accessible-finance.com/Logo.png',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://accessible-finance.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Guides',
            item: 'https://accessible-finance.com/articles.html',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: item.title,
            item: url,
          },
        ],
      },
    ],
  };
}

function buildGuidePage(template, id, item, build) {
  const wordCount = build.countWords(item);
  const readingMinutes = Math.max(5, Math.ceil(wordCount / 180));
  const sections = build.buildSections(item);
  const canonical = `https://accessible-finance.com/guides/${id}.html`;
  const relatedIds = getRelatedIds(id, item, build.guides);

  let html = prefixTemplatePaths(template);
  html = removeRegion(html, 'ARTICLE_RUNTIME');
  html = html
    .replace(/<meta name="robots"[^>]*>\s*/i, '')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(item.title)} | Accessible Finance</title>`)
    .replace(
      /<meta name="description"[^>]*>/i,
      `<meta name="description" content="${escapeHtml(item.deck)}">`
    )
    .replace(
      /<link rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="${canonical}">`
    )
    .replace(
      /<meta property="og:title"[^>]*>/i,
      `<meta property="og:title" content="${escapeHtml(item.title)}">`
    )
    .replace(
      /<meta property="og:description"[^>]*>/i,
      `<meta property="og:description" content="${escapeHtml(item.deck)}">`
    )
    .replace(
      '<meta charset="UTF-8">',
      `<meta charset="UTF-8">\n${adsenseLoader}\n<meta name="robots" content="index,follow,max-image-preview:large">\n<meta name="author" content="Accessible Finance">`
    )
    .replace(
      '<meta property="og:type" content="article">',
      `<meta property="og:type" content="article">\n<meta property="og:url" content="${canonical}">`
    );

  const structuredData = JSON.stringify(
    buildStructuredData(id, item, wordCount, readingMinutes),
    null,
    2
  ).replace(/</g, '\\u003c');
  html = html.replace(
    '</head>',
    `<script type="application/ld+json">\n${structuredData}\n</script>\n</head>`
  );

  const header = `  <div class="article-head-inner">
    <div class="crumb"><a href="../articles.html">Guides</a><span class="sep">&rsaquo;</span>${escapeHtml(item.category)}</div>
    <span class="cat-tag">${escapeHtml(item.category)}</span>
    <h1>${item.titleHtml}</h1>
    <p class="deck">${escapeHtml(item.deck)}</p>
    <div class="article-meta">
      <span class="meta-item">${readingMinutes} min read</span>
      <span class="meta-item">${escapeHtml(item.level)}</span>
      <span class="meta-item">Reviewed ${escapeHtml(item.updated)}</span>
    </div>
    ${build.renderArticleBrief(item)}
    <div class="publisher-note">
      <span><strong>By Accessible Finance</strong> &middot; Educational information, not personal advice</span>
      <a href="../editorial-policy.html">How we research and review</a>
    </div>
  </div>`;

  const toc = `  <details class="toc reveal" open>
    <summary><span>On this page</span><span class="toc-count">${sections.length} sections</span></summary>
    <div class="toc-label">Contents</div>
    <ul class="toc-list">
      ${sections.map((section) => `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`).join('\n      ')}
    </ul>
  </details>`;

  const body = `  <article class="article-body">
    ${sections.map((section, index) => `<section>
      <h2 id="${section.id}"><span class="section-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(section.title)}</span></h2>
      ${section.body}
    </section>`).join('\n    ')}
  </article>`;

  const related = `  <div class="related-grid">
    ${relatedIds.map((relatedId) => {
      const relatedItem = build.guides[relatedId];
      const relatedMinutes = Math.max(5, Math.ceil(build.countWords(relatedItem) / 180));
      return `<a href="${relatedId}.html" class="related-card reveal">
        <div class="cat">${escapeHtml(relatedItem.category)}</div>
        <h3>${escapeHtml(relatedItem.title)}</h3>
        <div class="meta">${relatedMinutes} min read &middot; ${escapeHtml(relatedItem.level)}</div>
      </a>`;
    }).join('\n    ')}
  </div>`;

  html = replaceRegion(html, 'ARTICLE_HEAD', header);
  html = replaceRegion(html, 'ARTICLE_TOC', toc);
  html = replaceRegion(html, 'ARTICLE_BODY', body);
  html = replaceRegion(html, 'ARTICLE_RELATED', related);
  return html;
}

function categorySlug(category) {
  const categories = {
    Fundamentals: 'fundamentals',
    Compounding: 'fundamentals',
    'Asset Classes': 'assets',
    'Portfolio Thinking': 'portfolio',
    'Market Behaviour': 'behavior',
    'Canadian Money': 'canadian',
    'Getting Started': 'getting-started',
    'Money Systems': 'money-systems',
  };
  return categories[category] || 'fundamentals';
}

function updateGuideLibrary(build) {
  const entries = Object.entries(build.guides);
  const [featuredId, featuredItem] = entries[0];
  const featuredMinutes = Math.max(5, Math.ceil(build.countWords(featuredItem) / 180));
  const featured = `<section class="featured-wrap reveal d2">
  <a href="guides/${featuredId}.html" class="featured" data-cat="${categorySlug(featuredItem.category)}" data-level="${featuredItem.level.toLowerCase()}">
    <div>
      <div class="featured-badge">Featured Guide</div>
      <h2>${featuredItem.titleHtml}</h2>
      <p class="ex">${escapeHtml(featuredItem.deck)}</p>
      <div class="meta">${featuredMinutes} min read &middot; ${escapeHtml(featuredItem.level)} &middot; ${escapeHtml(featuredItem.category)}</div>
    </div>
    <div class="featured-visual" aria-hidden="true">01</div>
  </a>
</section>`;

  const cards = entries.slice(1).map(([id, item], index) => {
    const readingMinutes = Math.max(5, Math.ceil(build.countWords(item) / 180));
    return `<a href="guides/${id}.html" class="card" data-cat="${categorySlug(item.category)}" data-level="${item.level.toLowerCase()}">
      <div class="cat">${escapeHtml(item.category)} <span class="lev">${escapeHtml(item.level)}</span></div>
      <div class="glyph" aria-hidden="true">${String(index + 2).padStart(2, '0')}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="ex">${escapeHtml(item.deck)}</p>
      <div class="read"><span>${readingMinutes} min read</span><span class="arrow">&rarr;</span></div>
    </a>`;
  }).join('\n\n    ');

  let library = read('articles.html');
  library = replaceRegion(library, 'FEATURED_GUIDE', featured);
  library = replaceRegion(library, 'GUIDE_GRID', cards);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Accessible Finance Guide Library',
    numberOfItems: entries.length,
    itemListElement: entries.map(([id, item], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: `https://accessible-finance.com/guides/${id}.html`,
    })),
  };
  const schema = `<script id="guide-library-schema" type="application/ld+json">\n${JSON.stringify(itemList, null, 2).replace(/</g, '\\u003c')}\n</script>`;
  if (/<script id="guide-library-schema"[\s\S]*?<\/script>/.test(library)) {
    library = library.replace(/<script id="guide-library-schema"[\s\S]*?<\/script>/, schema);
  } else {
    library = library.replace('</head>', `${schema}\n</head>`);
  }
  write('articles.html', library);
}

function updateStaticGuideLinks() {
  const htmlFiles = fs.readdirSync(root)
    .filter((file) => file.endsWith('.html') && file !== 'article.html');
  htmlFiles.forEach((file) => {
    const before = read(file);
    const after = before.replace(
      /article\.html\?id=([a-z0-9-]+)/g,
      'guides/$1.html'
    );
    if (after !== before) write(file, after);
  });
}

function xmlUrl(location, priority, changeFrequency) {
  return `  <url>
    <loc>${location}</loc>
    <lastmod>${reviewedDate}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function updateSitemap(build) {
  const corePages = [
    ['https://accessible-finance.com/', '1.0', 'weekly'],
    ['https://accessible-finance.com/articles.html', '0.9', 'weekly'],
    ['https://accessible-finance.com/topic.html', '0.9', 'monthly'],
    ['https://accessible-finance.com/fire.html', '0.8', 'monthly'],
    ['https://accessible-finance.com/wealth-rank.html', '0.8', 'monthly'],
    ['https://accessible-finance.com/tax-calculator.html', '0.8', 'monthly'],
    ['https://accessible-finance.com/about.html', '0.7', 'monthly'],
    ['https://accessible-finance.com/editorial-policy.html', '0.6', 'monthly'],
    ['https://accessible-finance.com/contact.html', '0.5', 'yearly'],
    ['https://accessible-finance.com/privacy.html', '0.3', 'yearly'],
    ['https://accessible-finance.com/disclaimer.html', '0.3', 'yearly'],
    ['https://accessible-finance.com/us/', '0.9', 'weekly'],
    ['https://accessible-finance.com/us/accounts.html', '0.8', 'monthly'],
    ['https://accessible-finance.com/us/tax-calculator.html', '0.8', 'monthly'],
    ['https://accessible-finance.com/us/fire.html', '0.8', 'monthly'],
  ];

  const pageEntries = corePages.map((entry) => xmlUrl(...entry));
  const guideEntries = Object.keys(build.guides).map((id) =>
    xmlUrl(`https://accessible-finance.com/guides/${id}.html`, '0.7', 'monthly')
  );

  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pageEntries, ...guideEntries].join('\n')}
</urlset>
`
  );
}

function main() {
  const build = loadGuideBuild();
  const template = read('article.html');
  fs.mkdirSync(guideDirectory, { recursive: true });

  Object.entries(build.guides).forEach(([id, item]) => {
    write(path.join('guides', `${id}.html`), buildGuidePage(template, id, item, build));
  });

  updateGuideLibrary(build);
  updateStaticGuideLinks();
  updateSitemap(build);
  process.stdout.write(`Generated ${Object.keys(build.guides).length} static guide pages.\n`);
}

main();
